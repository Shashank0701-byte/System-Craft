import Link from 'next/link';

interface HeroProps {
  userName?: string;
  onCreateDesign?: () => void;
  isCreating?: boolean;
}

export function Hero({ userName = 'Designer', onCreateDesign, isCreating = false }: HeroProps) {
  return (
    <div className="mb-6 rounded-xl border border-white/[0.04] bg-[#0c0d16]/30 px-5 py-3.5 relative overflow-hidden select-none">
      {/* Noise background */}
      <div className="noise-overlay absolute inset-0 pointer-events-none opacity-20" />
      
      {/* Decorative subtle background gradients */}
      <div className="pointer-events-none absolute -left-10 -top-10 size-32 bg-cyan-400/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-10 size-32 bg-indigo-400/5 rounded-full blur-3xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
        <div>
          {/* NOC telemetry tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-400/5 border border-cyan-400/10 text-[8px] font-mono tracking-widest text-cyan-400 uppercase">
              <span className="relative flex h-1 w-1">
                <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-30 animate-ping" />
                <span className="relative inline-flex h-1 w-1 rounded-full bg-cyan-400" />
              </span>
              WORKSPACE STATUS: ACTIVE
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.04] text-[8px] font-mono tracking-widest text-white/30 uppercase">
              NODE: MUMBAI-1 (AZ-A)
            </span>
          </div>

          <h2 className="text-sm font-bold text-white/95 tracking-tight font-display">
            Resuming console session, {userName}
          </h2>
          <p className="text-white/40 max-w-xl text-[10px] mt-0.5 leading-relaxed font-body">
            Design sandbox component clusters. Run evaluations and chaos scenarios.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link 
            href="/practice" 
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.04] text-white/70 hover:text-white transition-all cursor-pointer text-center"
          >
            Practice Templates
          </Link>
          <button 
            onClick={onCreateDesign}
            disabled={isCreating}
            className="px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg bg-white text-[#080a12] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200 hover:bg-cyan-50 hover:-translate-y-0.5 active:translate-y-px disabled:opacity-50 disabled:cursor-wait cursor-pointer flex items-center gap-1.5"
          >
            {isCreating ? 'Provisioning...' : 'Provision Sandbox'}
          </button>
        </div>
      </div>
    </div>
  );
}
