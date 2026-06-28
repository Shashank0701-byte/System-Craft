/**
 * XP & Level System - Static Definitions
 * Extracted from xp.ts so that client components can import this without
 * pulling in Mongoose and Node.js dependencies.
 */

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
