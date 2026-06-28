'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/src/lib/firebase/authClient';
import { useAuth } from '@/src/lib/firebase/AuthContext';
import type { LevelInfo } from '@/src/lib/achievements/xp';

export interface XPState {
  total: number;
  level: number;
  title: string;
  progress: {
    current: number;
    required: number;
    percent: number;
  };
}

export interface StreakState {
  current: number;
  longest: number;
  lastActivityDate: string | null;
}

export interface SkillScore {
  name: string;
  icon: string;
  score: number; // 0–100
}

interface UseMetricsReturn {
  xp: XPState | null;
  streaks: StreakState | null;
  heatmap: Record<string, number>;
  skills: SkillScore[];
  pinnedAchievements: string[];
  levels: LevelInfo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMetrics(): UseMetricsReturn {
  const { user } = useAuth();
  const [xp, setXP] = useState<XPState | null>(null);
  const [streaks, setStreaks] = useState<StreakState | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [skills, setSkills] = useState<SkillScore[]>([]);
  const [pinnedAchievements, setPinnedAchievements] = useState<string[]>([]);
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) {
      setXP(null);
      setStreaks(null);
      setHeatmap({});
      setSkills([]);
      setPinnedAchievements([]);
      setLevels([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/user/metrics');
      if (!res.ok) throw new Error('Failed to load metrics');
      const data = await res.json();
      setXP(data.xp ?? null);
      setStreaks(data.streaks ?? null);
      setHeatmap(data.heatmap ?? {});
      setSkills(data.skills ?? []);
      setPinnedAchievements(data.pinnedAchievements ?? []);
      setLevels(data.levels ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { xp, streaks, heatmap, skills, pinnedAchievements, levels, isLoading, error, refresh: fetch };
}
