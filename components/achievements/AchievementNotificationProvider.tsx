'use client';

import { useAchievementNotifications } from '@/src/hooks/useAchievementNotifications';
import { AchievementToastQueue } from './AchievementToast';

/**
 * Drop this inside AuthProvider in the root layout.
 * Polls for new achievement unlocks and renders toast notifications.
 */
export function AchievementNotificationProvider({ children }: { children: React.ReactNode }) {
  const { queue, dismiss } = useAchievementNotifications();

  return (
    <>
      {children}
      <AchievementToastQueue queue={queue} onDismiss={dismiss} />
    </>
  );
}
