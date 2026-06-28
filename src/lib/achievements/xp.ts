/**
 * XP & Level System
 * Centralizes XP award actions and level calculation.
 */

import type { Types } from 'mongoose';
import UserMetrics from './metrics';

// ─── Level Thresholds ────────────────────────────────────────────────────────

export interface LevelInfo {
  level: number;
  title: string;
  minXP: number;
  maxXP: number | null; // null = no upper bound (final level)
}

export const LEVELS: LevelInfo[] = [
  { level: 1,  title: 'Student',                  minXP: 0,     maxXP: 500    },
  { level: 2,  title: 'Junior Engineer',           minXP: 500,   maxXP: 1500   },
  { level: 3,  title: 'Software Engineer',         minXP: 1500,  maxXP: 3500   },
  { level: 4,  title: 'Senior Engineer',           minXP: 3500,  maxXP: 7000   },
  { level: 5,  title: 'Staff Engineer',            minXP: 7000,  maxXP: 12000  },
  { level: 6,  title: 'Principal Engineer',        minXP: 12000, maxXP: 20000  },
  { level: 7,  title: 'Architect',                 minXP: 20000, maxXP: 35000  },
  { level: 8,  title: 'Distinguished Architect',   minXP: 35000, maxXP: 60000  },
  { level: 9,  title: 'SystemCraft Legend',        minXP: 60000, maxXP: null   },
];

export function getLevelFromXP(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXPProgressInLevel(xp: number): { current: number; required: number; percent: number } {
  const info = getLevelFromXP(xp);
  if (info.maxXP === null) {
    return { current: xp - info.minXP, required: 0, percent: 100 };
  }
  const current = xp - info.minXP;
  const required = info.maxXP - info.minXP;
  return { current, required, percent: Math.min(100, Math.floor((current / required) * 100)) };
}

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
