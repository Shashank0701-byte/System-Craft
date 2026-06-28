'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '@/src/lib/firebase/authClient';
import { useAuth } from '@/src/lib/firebase/AuthContext';
import { ACHIEVEMENT_MAP } from '@/src/lib/achievements/definitions';
import type { ToastAchievement } from '@/components/achievements/AchievementToast';

interface ToastItem extends ToastAchievement {
  key: string;
}

/**
 * Polls /api/user/achievements every 30s and surfaces newly unlocked
 * achievements as toast notifications.
 *
 * The "last seen" timestamp is stored in memory so a page refresh
 * won't re-show old achievements (they'd be older than session start).
 */
export function useAchievementNotifications() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const sessionStartRef = useRef(new Date().toISOString());
  const seenKeysRef = useRef(new Set<string>());

  useEffect(() => {
    sessionStartRef.current = new Date().toISOString();
    seenKeysRef.current.clear();
    setQueue([]);
  }, [user?.uid]);

  const poll = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/user/achievements');
      if (!res.ok) return;
      const data = await res.json();

      const recent: Array<{ achievementId: string; tier: string; xpAwarded: number; unlockedAt: string }> =
        data.recentlyUnlocked ?? [];

      const newToasts: ToastItem[] = [];

      for (const unlock of recent) {
        const key = `${unlock.achievementId}::${unlock.tier}`;
        if (seenKeysRef.current.has(key)) continue;
        // Only show if unlocked after this browser session started
        if (unlock.unlockedAt < sessionStartRef.current) {
          seenKeysRef.current.add(key);
          continue;
        }

        seenKeysRef.current.add(key);
        const def = ACHIEVEMENT_MAP.get(unlock.achievementId);
        if (!def) continue;

        newToasts.push({
          key: `${key}-${Date.now()}`,
          achievementId: unlock.achievementId,
          title: def.title,
          tier: unlock.tier as ToastAchievement['tier'],
          icon: def.icon,
          xpAwarded: unlock.xpAwarded,
        });
      }

      if (newToasts.length > 0) {
        setQueue((prev) => [...prev, ...newToasts]);
      }
    } catch {
      // Silent fail — notifications are non-critical
    }
  }, [user]);

  // Poll on mount and every 30 seconds
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [poll]);

  const dismiss = useCallback((key: string) => {
    setQueue((prev) => prev.filter((t) => t.key !== key));
  }, []);

  return { queue, dismiss };
}
