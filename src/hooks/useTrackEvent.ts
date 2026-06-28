'use client';

import { useCallback, useRef } from 'react';
import { authFetch } from '@/src/lib/firebase/authClient';
import { useAuth } from '@/src/lib/firebase/AuthContext';

type TrackEvent =
  | 'simulation_executed'
  | 'simulation_million_rps'
  | 'reference_architecture_completed'
  | 'ai_review_completed'
  | 'chaos_constraints_addressed'
  | 'high_availability_design'
  | 'max_nodes_in_design';

/**
 * Fire-and-forget metric tracking for client-side events.
 * Debounces identical events within a 5 second window to avoid
 * double-counting rapid re-triggers (e.g. simulation toggle).
 *
 * Usage:
 *   const { track } = useTrackEvent();
 *   track('simulation_executed', { targetRps: 500000 });
 */
export function useTrackEvent() {
  const { user } = useAuth();
  const lastFiredRef = useRef<Map<string, number>>(new Map());

  const track = useCallback(
    (event: TrackEvent, payload?: Record<string, unknown>) => {
      if (!user) return;

      const key = `${event}:${JSON.stringify(payload ?? {})}`;
      const now = Date.now();
      const lastFired = lastFiredRef.current.get(key) ?? 0;

      // Debounce: 5 second window per unique (event, payload) pair
      if (now - lastFired < 5000) return;
      lastFiredRef.current.set(key, now);

      authFetch('/api/user/track', {
        method: 'POST',
        body: JSON.stringify({ event, payload }),
      }).catch((err) => {
        console.warn(`Failed to track event "${event}":`, err);
      });
    },
    [user]
  );

  return { track };
}
