'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/src/lib/firebase/authClient';
import { useAuth } from '@/src/lib/firebase/AuthContext';
import type { AchievementCategory, AchievementTier, AchievementTierDef } from '@/src/lib/achievements/definitions';

// ─── Types (mirroring what the API returns) ──────────────────────────────────

export interface AchievementProgress {
  current: number;
  required: number;
  percent: number;
}

export interface AchievementState {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  hidden: boolean;
  tiers: AchievementTierDef[];
  unlockedTiers: AchievementTier[];
  highestTier: AchievementTier | null;
  nextTier: AchievementTier | null;
  progress: AchievementProgress | null;
  unlockedAt: string | null;
  isCompleted: boolean;
}

export interface RecentUnlock {
  achievementId: string;
  tier: AchievementTier;
  xpAwarded: number;
  unlockedAt: string;
}

interface UseAchievementsReturn {
  achievements: AchievementState[];
  recentlyUnlocked: RecentUnlock[];
  byCategory: Record<AchievementCategory, AchievementState[]>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  updatePinned: (ids: string[]) => Promise<void>;
}

export function useAchievements(): UseAchievementsReturn {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementState[]>([]);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<RecentUnlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/user/achievements');
      if (!res.ok) throw new Error('Failed to load achievements');
      const data = await res.json();
      setAchievements(data.achievements ?? []);
      setRecentlyUnlocked(data.recentlyUnlocked ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const byCategory = achievements.reduce<Record<string, AchievementState[]>>(
    (acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category].push(a);
      return acc;
    },
    {}
  ) as Record<AchievementCategory, AchievementState[]>;

  const updatePinned = useCallback(
    async (ids: string[]) => {
      await authFetch('/api/user/achievements', {
        method: 'PATCH',
        body: JSON.stringify({ pinnedAchievements: ids }),
      });
    },
    []
  );

  return {
    achievements,
    recentlyUnlocked,
    byCategory,
    isLoading,
    error,
    refresh: fetch,
    updatePinned,
  };
}
