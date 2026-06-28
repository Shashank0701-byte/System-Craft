'use client';

import type { SkillScore } from '@/src/hooks/useMetrics';

interface SkillBarsProps {
  skills: SkillScore[];
  isLoading: boolean;
}

export function SkillBars({ skills, isLoading }: SkillBarsProps) {
  if (isLoading) {
    return <div className="rounded-xl border border-white/[0.04] bg-[#0c0d16]/40 h-48 animate-pulse" />;
  }

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#0c0d16]/40 p-5 font-mono">
      <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold mb-4">Skill Mastery</p>
      <div className="space-y-3">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[12px] text-white/30">{skill.icon}</span>
                <span className="text-[9px] text-white/50 uppercase tracking-wider">{skill.name}</span>
              </div>
              <span className="text-[9px] font-bold text-white/60">{skill.score}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.04]">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-700"
                style={{ width: `${skill.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
