'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { AchievementTier } from '@/src/lib/achievements/definitions';

export interface ToastAchievement {
  achievementId: string;
  title: string;
  tier: AchievementTier;
  icon: string;
  xpAwarded: number;
}

interface AchievementToastProps {
  achievement: ToastAchievement;
  onDismiss: () => void;
}

const TIER_COLORS: Record<AchievementTier, { border: string; glow: string; badge: string; label: string }> = {
  bronze:   { border: 'border-amber-700/60',   glow: 'shadow-amber-900/30',   badge: 'bg-amber-900/60 text-amber-300',   label: 'BRONZE'   },
  silver:   { border: 'border-slate-400/60',   glow: 'shadow-slate-400/20',   badge: 'bg-slate-700/60 text-slate-300',   label: 'SILVER'   },
  gold:     { border: 'border-yellow-500/60',  glow: 'shadow-yellow-500/30',  badge: 'bg-yellow-900/60 text-yellow-300', label: 'GOLD'     },
  platinum: { border: 'border-cyan-400/60',    glow: 'shadow-cyan-400/30',    badge: 'bg-cyan-900/60 text-cyan-300',     label: 'PLATINUM' },
  diamond:  { border: 'border-violet-400/60',  glow: 'shadow-violet-400/40',  badge: 'bg-violet-900/60 text-violet-300', label: 'DIAMOND'  },
};

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);
  const colors = TIER_COLORS[achievement.tier];

  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 50);
    // Auto-dismiss after 5s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => dismissRef.current(), 300);
    }, 5000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => dismissRef.current(), 300);
  }, []);

  return (
    <div
      className={`
        flex items-center gap-3 w-80 p-4 rounded-xl
        bg-[#0c0d16]/95 backdrop-blur-xl
        border ${colors.border}
        shadow-2xl ${colors.glow}
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
        <span className="material-symbols-outlined text-[20px] text-cyan-400">
          {achievement.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${colors.badge}`}>
            {colors.label}
          </span>
          <span className="text-[8px] font-mono text-white/30 uppercase tracking-wider">Achievement</span>
        </div>
        <p className="text-[11px] font-bold text-white truncate">{achievement.title}</p>
        <p className="text-[9px] font-mono text-white/40 mt-0.5">
          +{achievement.xpAwarded} XP
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[14px]">close</span>
      </button>
    </div>
  );
}

// ─── Toast Queue Manager ─────────────────────────────────────────────────────

interface ToastItem extends ToastAchievement {
  key: string;
}

interface AchievementToastQueueProps {
  queue: ToastItem[];
  onDismiss: (key: string) => void;
}

/**
 * Renders up to 3 achievement toasts stacked in the bottom-right corner.
 */
export function AchievementToastQueue({ queue, onDismiss }: AchievementToastQueueProps) {
  const visible = queue.slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
      {visible.map((item) => (
        <div key={item.key} className="pointer-events-auto">
          <AchievementToast
            achievement={item}
            onDismiss={() => onDismiss(item.key)}
          />
        </div>
      ))}
    </div>
  );
}
