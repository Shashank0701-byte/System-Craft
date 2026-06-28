interface CreateDesignCardProps {
  onClick?: () => void;
  isLoading?: boolean;
}

export function CreateDesignCard({ onClick, isLoading = false }: CreateDesignCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="group flex flex-col justify-between min-h-[260px] rounded-xl border border-dashed border-white/[0.06] hover:border-cyan-500/25 bg-[#0c0d16]/10 hover:bg-white/[0.01] hover:shadow-[0_0_30px_rgba(34,211,238,0.01)] p-5 transition-all duration-300 cursor-pointer w-full disabled:opacity-50 disabled:cursor-wait select-none text-left"
    >
      <div className="size-9 rounded-lg border border-white/[0.05] bg-white/[0.02] flex items-center justify-center group-hover:border-cyan-500/25 group-hover:bg-cyan-500/[0.02] transition-all duration-300">
        {isLoading ? (
          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
        ) : (
          <span className="material-symbols-outlined text-white/30 group-hover:text-cyan-400 transition-colors text-[18px]">add</span>
        )}
      </div>

      <div className="my-auto py-4">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white/80 mb-1 group-hover:text-white transition-colors">
          {isLoading ? 'INITIALIZING CLUSTER...' : 'PROVISION NEW SANDBOX'}
        </h4>
        <p className="text-[10px] font-mono text-white/25 leading-normal">
          {isLoading ? 'Configuring sandboxed network topology AZ-A' : 'Deploy a clean sandboxed design canvas with active status routing.'}
        </p>
      </div>

      {/* Cluster initialization metadata */}
      <div className="border-t border-dashed border-white/[0.03] pt-3.5 w-full space-y-1.5 font-mono text-[8px] tracking-widest text-white/15 uppercase">
        <div className="flex justify-between">
          <span>DEPLOYMENT REGION</span>
          <span>GLOBAL-MUM-1A</span>
        </div>
        <div className="flex justify-between">
          <span>EST. PROVISION TIME</span>
          <span className="text-cyan-400/60">&lt; 1.2S</span>
        </div>
        <div className="flex justify-between">
          <span>ENV / RUNTIME</span>
          <span>WASM-NODE</span>
        </div>
      </div>
    </button>
  );
}
