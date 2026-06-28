/**
 * XP & Level System
 * Centralizes XP award actions and level calculation.
 */

import type { Types } from 'mongoose';
import UserMetrics from './metrics';
import { getLevelFromXP, type LevelInfo, LEVELS, getXPProgressInLevel } from './levels';

export { getLevelFromXP, LEVELS, getXPProgressInLevel };
export type { LevelInfo };

// ─── XP Award Actions ────────────────────────────────────────────────────────

export const XP_ACTIONS = {
  ARCHITECTURE_CREATED:         20,
  INTERVIEW_COMPLETED:          50,
  AI_REVIEW:                    15,
  REFERENCE_ARCHITECTURE:       30,
  CHAOS_SIMULATION:             40,
  HIGH_AI_SCORE_BONUS:          25,   // applied when score >= 90
  PERFECT_SCORE_BONUS:          50,   // applied when score === 100
  SIMULATION_EXECUTED:          10,
} as const;

export type XPAction = keyof typeof XP_ACTIONS;

/**
 * Award XP to a user for a given action.
 * Returns the new total XP and the new level.
 * Must be called inside an already-connected mongoose context.
 */
export async function awardXP(
  userId: Types.ObjectId | string,
  action: XPAction,
  bonusXP = 0
): Promise<{ totalXP: number; level: number; leveledUp: boolean; levelTitle: string }> {
  const earned = XP_ACTIONS[action] + bonusXP;

  const before = await UserMetrics.findOne({ userId }).select('totalXP level').lean();
  const prevLevel = before?.level ?? 1;

  const updated = await UserMetrics.findOneAndUpdate(
    { userId },
    { $inc: { totalXP: earned } },
    { new: true, upsert: true, select: 'totalXP level' }
  );

  const newXP = updated?.totalXP ?? earned;
  const newLevelInfo = getLevelFromXP(newXP);
  const leveledUp = newLevelInfo.level > prevLevel;

  // Persist the new level value
  if (leveledUp) {
    await UserMetrics.updateOne({ userId }, { $set: { level: newLevelInfo.level } });
  }

  return {
    totalXP: newXP,
    level: newLevelInfo.level,
    leveledUp,
    levelTitle: newLevelInfo.title,
  };
}
