import React from 'react';

export function DesignCanvas() {
  return (
    <main className="flex-1 relative bg-white dark:bg-[#0f1115] bg-grid-pattern overflow-hidden cursor-crosshair">
      {/* Connecting Lines (SVG Layer) */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 opacity-50">
        <defs>
          <marker id="arrowhead" markerHeight="7" markerWidth="10" orient="auto" refX="9" refY="3.5">
            <polygon fill="#4f4b64" points="0 0, 10 3.5, 0 7"></polygon>
          </marker>
        </defs>
        {/* Line from Client to LB */}
        <path d="M 220 180 C 220 180, 420 180, 420 180" fill="none" markerEnd="url(#arrowhead)" stroke="#4f4b64" strokeWidth="2"></path>
        {/* Line from LB to API */}
        <path d="M 480 180 C 580 180, 580 180, 680 180" fill="none" markerEnd="url(#arrowhead)" stroke="#4f4b64" strokeWidth="2"></path>
        {/* Line from API to DB */}
        <path d="M 740 180 C 790 180, 790 320, 840 320" fill="none" markerEnd="url(#arrowhead)" stroke="#4f4b64" strokeWidth="2"></path>
        {/* Line from API to Cache */}
        <path d="M 740 180 C 790 180, 790 80, 840 80" fill="none" markerEnd="url(#arrowhead)" stroke="#4f4b64" strokeWidth="2"></path>
      </svg>

      {/* Canvas Nodes */}
      <div className="absolute inset-0 z-10">
        {/* Client Node */}
        <div className="absolute left-[160px] top-[150px] w-[60px] h-[60px] bg-white dark:bg-[#1e1e24] border-2 border-transparent hover:border-primary shadow-lg rounded-xl flex flex-col items-center justify-center cursor-move group">
          <span className="material-symbols-outlined text-blue-500 dark:text-blue-400" style={{ fontSize: '28px' }}>smartphone</span>
          <div className="absolute -bottom-8 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Mobile App</div>
        </div>

        {/* Load Balancer Node */}
        <div className="absolute left-[420px] top-[150px] w-[60px] h-[60px] bg-white dark:bg-[#1e1e24] border-2 border-transparent hover:border-primary shadow-lg rounded-xl flex flex-col items-center justify-center cursor-move group">
          <span className="material-symbols-outlined text-orange-500 dark:text-orange-400" style={{ fontSize: '28px' }}>alt_route</span>
          <div className="absolute -bottom-8 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Nginx LB</div>
        </div>

        {/* API Service Node */}
        <div className="absolute left-[680px] top-[150px] w-[60px] h-[60px] bg-white dark:bg-[#1e1e24] border-2 border-transparent hover:border-primary shadow-lg rounded-xl flex flex-col items-center justify-center cursor-move group">
          <span className="material-symbols-outlined text-purple-500 dark:text-purple-400" style={{ fontSize: '28px' }}>dns</span>
          <div className="absolute -top-3 -right-3 size-6 bg-slate-200 dark:bg-[#2b2839] rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-[#0f1115]">3</div>
          <div className="absolute -bottom-8 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">API Cluster</div>
        </div>

        {/* Cache Node */}
        <div className="absolute left-[840px] top-[50px] w-[60px] h-[60px] bg-white dark:bg-[#1e1e24] border-2 border-transparent hover:border-primary shadow-lg rounded-xl flex flex-col items-center justify-center cursor-move group">
          <span className="material-symbols-outlined text-red-500 dark:text-red-400" style={{ fontSize: '28px' }}>bolt</span>
          <div className="absolute -bottom-8 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Redis</div>
        </div>

        {/* Database Node (Selected) */}
        <div className="absolute left-[840px] top-[290px] w-[60px] h-[60px] bg-white dark:bg-[#1e1e24] ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-[#0f1115] shadow-[0_0_20px_rgba(71,37,244,0.3)] rounded-xl flex flex-col items-center justify-center cursor-move z-20">
          <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400" style={{ fontSize: '28px' }}>database</span>
        </div>
      </div>

      {/* Live Cursor (Simulated) */}
      <div className="absolute left-[520px] top-[240px] z-50 pointer-events-none transition-all duration-700 ease-in-out">
        <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#F43F5E" stroke="white" strokeWidth="2"></path>
        </svg>
        <div className="absolute left-4 top-4 bg-[#F43F5E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap">
          Alex M.
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1e1e24] border border-slate-200 dark:border-border-dark p-1.5 rounded-full shadow-xl flex items-center gap-1 z-30">
        <button className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer" title="Pan">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>pan_tool</span>
        </button>
        <button className="size-8 flex items-center justify-center rounded-full bg-primary/10 text-primary transition-colors cursor-pointer" title="Select">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>near_me</span>
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-border-dark mx-1"></div>
        <button className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer" title="Undo">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>undo</span>
        </button>
        <button className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer" title="Redo">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>redo</span>
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-border-dark mx-1"></div>
        <button className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer" title="Zoom Out">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>remove</span>
        </button>
        <span className="text-xs font-mono text-slate-500 w-8 text-center">100%</span>
        <button className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer" title="Zoom In">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
        </button>
      </div>
    </main>
  );
}
