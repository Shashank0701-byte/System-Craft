/**
 * Achievement Engine
 *
 * Call `evaluateAchievements(userId)` after any metric update.
 * It compares the user's current metrics against every achievement definition,
 * inserts newly unlocked tiers (idempotent via unique index), awards XP,
 * and updates the computed/derived metric fields.
 *
 * The engine is purely additive — it never revokes an earned achievement.
 */

import type { Types } from 'mongoose';
import UserMetrics, { type IUserMetricsData } from './metrics';
import UserAchievement from './userAchievement';
import { ACHIEVEMENT_DEFINITIONS, type AchievementTier } from './definitions';
import { getLevelFromXP } from './xp';

export interface UnlockedAchievement {
  achievementId: string;
  tier: AchievementTier;
  title: string;
  xpAwarded: number;
}

/**
 * Core evaluation loop.
 * Must be called inside an already-connected mongoose context.
 *
 * @returns Array of newly unlocked (achievementId, tier) pairs during this run.
 */
export async function evaluateAchievements(
  userId: Types.ObjectId | string
): Promise<UnlockedAchievement[]> {
  const allNewlyUnlocked: UnlockedAchievement[] = [];
  let passCount = 0;
  const maxPasses = 3;

  while (passCount < maxPasses) {
    const newlyUnlocked = await _evaluateAchievementsPass(userId);
    if (newlyUnlocked.length === 0) break;
    allNewlyUnlocked.push(...newlyUnlocked);
    passCount++;
  }

  return allNewlyUnlocked;
}

async function _evaluateAchievementsPass(
  userId: Types.ObjectId | string
): Promise<UnlockedAchievement[]> {
  const metrics = await UserMetrics.findOne({ userId }).lean();
  if (!metrics) return [];

  // Load already-unlocked (achievementId, tier) pairs so we skip them
  const existing = await UserAchievement.find({ userId })
    .select('achievementId tier')
    .lean();

  const alreadyUnlocked = new Set(
    existing.map((u) => `${u.achievementId}::${u.tier}`)
  );

  const newlyUnlocked: UnlockedAchievement[] = [];
  let xpToAdd = 0;

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const currentValue = (metrics[def.metricKey as keyof IUserMetricsData] as number) ?? 0;

    for (const tierDef of def.tiers) {
      const key = `${def.id}::${tierDef.tier}`;
      if (alreadyUnlocked.has(key)) continue;

      if (currentValue >= tierDef.threshold) {
        try {
          await UserAchievement.create({
            userId,
            achievementId: def.id,
            tier: tierDef.tier,
            xpAwarded: tierDef.xpReward,
            progressAtUnlock: currentValue,
            unlockedAt: new Date(),
          });

          xpToAdd += tierDef.xpReward;
          newlyUnlocked.push({
            achievementId: def.id,
            tier: tierDef.tier,
            title: def.title,
            xpAwarded: tierDef.xpReward,
          });
        } catch (err: unknown) {
          // Unique index violation means another concurrent request beat us — skip
          if ((err as { code?: number })?.code !== 11000) throw err;
        }
      }
    }
  }

  // Flush accumulated XP in one write
  if (xpToAdd > 0) {
    const updated = await UserMetrics.findOneAndUpdate(
      { userId },
      { $inc: { totalXP: xpToAdd } },
      { new: true, select: 'totalXP' }
    );
    const newXP = updated?.totalXP ?? 0;
    const levelInfo = getLevelFromXP(newXP);
    await UserMetrics.updateOne({ userId }, { $set: { level: levelInfo.level } });
  }

  // Update derived/computed metrics after unlock
  if (newlyUnlocked.length > 0) {
    await updateDerivedMetrics(userId);
  }

  return newlyUnlocked;
}

/**
 * Recompute derived metrics that depend on other achievement counts.
 * Called after each evaluation pass.
 */
async function updateDerivedMetrics(userId: Types.ObjectId | string): Promise<void> {
  const allUnlocked = await UserAchievement.find({ userId })
    .select('achievementId tier')
    .lean();

  // Count unique categories unlocked
  const unlockedIds = new Set(allUnlocked.map((u) => u.achievementId));
  const categoriesUnlocked = new Set<string>();
  let scalabilityCompleted = 0;
  const scalabilityAchievements = new Set(
    ACHIEVEMENT_DEFINITIONS.filter((d) => d.category === 'scalability').map((d) => d.id)
  );

  for (const id of unlockedIds) {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === id);
    if (def) {
      categoriesUnlocked.add(def.category);
      if (scalabilityAchievements.has(id)) scalabilityCompleted++;
    }
  }

  // scalabilityAchievementsCompleted = 1 only when ALL scalability badges unlocked
  const scalabilityDone = scalabilityCompleted >= scalabilityAchievements.size ? 1 : 0;

  await UserMetrics.updateOne(
    { userId },
    {
      $set: {
        achievementCategoriesUnlocked: categoriesUnlocked.size,
        scalabilityAchievementsCompleted: scalabilityDone,
      },
    }
  );
}

/**
 * Utility: get the full achievement state for a user — definitions merged with
 * unlock status and progress — ready for the API to return.
 */
export async function getUserAchievementState(userId: Types.ObjectId | string) {
  const [metrics, unlocked] = await Promise.all([
    UserMetrics.findOne({ userId }).lean(),
    UserAchievement.find({ userId }).lean(),
  ]);

  const unlockedMap = new Map<string, { tiers: AchievementTier[]; unlockedAt: Date }>();
  for (const u of unlocked) {
    const existing = unlockedMap.get(u.achievementId);
    if (existing) {
      existing.tiers.push(u.tier);
    } else {
      unlockedMap.set(u.achievementId, { tiers: [u.tier], unlockedAt: u.unlockedAt });
    }
  }

  const TIER_ORDER: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const currentValue = metrics
      ? ((metrics[def.metricKey as keyof IUserMetricsData] as number) ?? 0)
      : 0;
    const unlockedEntry = unlockedMap.get(def.id);
    const unlockedTiers = unlockedEntry?.tiers ?? [];

    // Highest unlocked tier
    const highestTier = TIER_ORDER.filter((t) => unlockedTiers.includes(t)).at(-1) ?? null;

    // Next tier to unlock
    const nextTierDef = def.tiers.find((t) => !unlockedTiers.includes(t.tier)) ?? null;

    // Progress toward next tier
    const progress = nextTierDef
      ? {
          current: currentValue,
          required: nextTierDef.threshold,
          percent: Math.min(100, Math.floor((currentValue / nextTierDef.threshold) * 100)),
        }
      : null;

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      icon: def.icon,
      hidden: def.hidden && unlockedTiers.length === 0, // reveal once unlocked
      tiers: def.tiers,
      unlockedTiers,
      highestTier,
      nextTier: nextTierDef?.tier ?? null,
      progress,
      unlockedAt: unlockedEntry?.unlockedAt ?? null,
      isCompleted: unlockedTiers.length === def.tiers.length,
    };
  });
}
