/**
 * trackMetric — the single entry point for recording user actions.
 *
 * Usage:
 *   await trackMetric(userId, { architecturesCreated: 1 });
 *   await trackMetric(userId, { cacheImplementations: 2, shardingApplications: 1 });
 *
 * After updating metrics, the achievement engine runs automatically.
 * Returns the list of newly unlocked achievements for this event.
 */

import type { Types } from 'mongoose';
import UserMetrics, { type IUserMetricsData } from './metrics';
import { evaluateAchievements, type UnlockedAchievement } from './engine';

export type AllowedMetricKey = Exclude<
  keyof IUserMetricsData,
  | 'totalXP'
  | 'level'
  | 'currentStreak'
  | 'longestStreak'
  | 'lastActivityDate'
  | 'activityHeatmap'
  | 'pinnedAchievements'
  | 'achievementCategoriesUnlocked'
  | 'scalabilityAchievementsCompleted'
  | 'highScoreAcrossDifficulties'
>;

export type MetricPatch = Partial<Record<AllowedMetricKey, number>>;

/**
 * Increment one or more metrics by the supplied deltas, then evaluate achievements.
 * Pass negative values to decrement (e.g. correcting a bad value).
 */
export async function trackMetric(
  userId: Types.ObjectId | string,
  patch: MetricPatch
): Promise<UnlockedAchievement[]> {
  // Build the $inc payload — only include numeric metric keys
  const incPayload: Record<string, number> = {};
  for (const [key, delta] of Object.entries(patch)) {
    if (typeof delta === 'number') {
      incPayload[key] = delta;
    }
  }

  if (Object.keys(incPayload).length === 0) return [];

  await UserMetrics.findOneAndUpdate(
    { userId },
    { $inc: incPayload },
    { upsert: true }
  );

  // Update streak and heatmap
  await updateActivityStreak(userId);

  return evaluateAchievements(userId);
}

export async function setMetricIfHigher(
  userId: Types.ObjectId | string,
  key: keyof IUserMetricsData,
  value: number
): Promise<UnlockedAchievement[]> {
  await UserMetrics.findOneAndUpdate(
    { userId },
    { $max: { [key]: value } },
    { upsert: true }
  );

  return evaluateAchievements(userId);
}

/**
 * Update the user's daily activity streak and heatmap.
 * Called on every trackMetric invocation.
 */
async function updateActivityStreak(userId: Types.ObjectId | string): Promise<void> {
  const metrics = await UserMetrics.findOne({ userId })
    .select('lastActivityDate currentStreak longestStreak')
    .lean();

  const today = new Date();
  const todayKey = formatDateKey(today);

  const lastDate = metrics?.lastActivityDate
    ? new Date(metrics.lastActivityDate)
    : null;

  let newStreak = metrics?.currentStreak ?? 0;

  if (!lastDate) {
    newStreak = 1;
  } else {
    const daysSinceLastActivity = daysBetween(lastDate, today);
    if (daysSinceLastActivity === 0) {
      // Same day — no streak change
    } else if (daysSinceLastActivity === 1) {
      newStreak += 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  const longestStreak = Math.max(newStreak, metrics?.longestStreak ?? 0);

  await UserMetrics.updateOne(
    { userId },
    {
      $set: {
        lastActivityDate: today,
        currentStreak: newStreak,
        longestStreak,
      },
      $inc: {
        [`activityHeatmap.${todayKey}`]: 1,
      },
    }
  );
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const aDay = Math.floor(a.getTime() / msPerDay);
  const bDay = Math.floor(b.getTime() / msPerDay);
  return Math.abs(bDay - aDay);
}
