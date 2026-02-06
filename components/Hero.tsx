

export function Hero() {
  return (
    <section className="relative z-10 flex flex-col items-center justify-center px-4 pt-10 pb-20">
      {/* Badge */}
      <div className="mb-8 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 pl-1 text-sm text-slate-400 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10 cursor-default">
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
          <span className="pr-2">v1.0 is now live</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </div>
      </div>
      {/* Headlines */}
      <div className="text-center max-w-[800px] mb-10 flex flex-col gap-6">
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 glow-text">
          Practice System Design<br />Like a Real Interview
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The first simulator that grades your architecture in real-time. Master scalability, availability, and database sharding with interactive feedback.
        </p>
      </div>
      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full sm:w-auto">
        <button className="cursor-pointer w-full sm:w-auto flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary-hover hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200">
          <span className="material-symbols-outlined text-[20px]">draw</span>
          Start Designing
        </button>
        <button className="cursor-pointer w-full sm:w-auto flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-surface-dark px-8 text-base font-bold text-white hover:bg-white/5 hover:border-white/20 transition-all duration-200 group">
          <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-white transition-colors">login</span>
          Sign in with Google
        </button>
      </div>
      {/* Hero Graphic (3D Tilt) */}
      <div className="w-full max-w-6xl px-4 hero-perspective">
        <div className="hero-rotate relative rounded-xl border border-white/10 bg-[#18181b] shadow-2xl overflow-hidden aspect-[16/9] group">
          {/* Fake Browser Header */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-[#27272a] border-b border-white/5 flex items-center px-4 gap-2 z-20">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
              <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
              <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
            </div>
            <div className="ml-4 flex h-6 px-3 items-center rounded bg-[#18181b] border border-white/5 text-[10px] text-slate-500 font-mono w-64">
              systemcraft.app/design/interview-01
            </div>
          </div>
          {/* Diagram Canvas Image */}
          <div className="absolute inset-0 top-10 bg-[#121118] bg-[radial-gradient(#2b2839_1px,transparent_1px)] bg-[size:20px_20px]">
            {/* Background Image representing the canvas */}
            <div
              className="w-full h-full bg-cover bg-center opacity-90 transition-transform duration-700 group-hover:scale-105"
              data-alt="Dark abstract digital network diagram with glowing nodes and connections representing system architecture"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBMJdUsp7O3Lnzktpqp6sExelw0meOOh4JTyKSME0dXk8-J5ZH1lTg_3kZtB7fpfS7zC5jRF9Iq1nu2v1D1CvsgD0RrpEW_pTSAiElndKclplqBgaDDa0WGIq2vhhtDbwwOB4fl6VsJQGtMbu2YIinaUAFMGEe1LjPuDUmlLSNhjNhlRDloh0HEvmoLtCl0MBq0jT1gFI68n9LhgGPAy2NPF6SkhoVsXdqvSgBpWqnNgRd_gqvqzZevUtFr48VNyzQFT3oKh6wTnpc0')" }}
            >
            </div>
            {/* Overlay UI elements for realism */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="w-12 h-12 bg-surface-dark border border-white/10 rounded-lg flex items-center justify-center text-white/70 hover:text-primary hover:border-primary/50 transition cursor-pointer">
                <span className="material-symbols-outlined">dns</span>
              </div>
              <div className="w-12 h-12 bg-surface-dark border border-white/10 rounded-lg flex items-center justify-center text-white/70 hover:text-primary hover:border-primary/50 transition cursor-pointer">
                <span className="material-symbols-outlined">storage</span>
              </div>
              <div className="w-12 h-12 bg-surface-dark border border-white/10 rounded-lg flex items-center justify-center text-white/70 hover:text-primary hover:border-primary/50 transition cursor-pointer">
                <span className="material-symbols-outlined">memory</span>
              </div>
            </div>
            {/* Central floating label mimicking a node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-dark/90 backdrop-blur border border-primary/50 px-4 py-2 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-green-400">check_circle</span>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Load Balancer</span>
                <span className="text-sm font-bold text-white">Healthy (3/3 Nodes)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
