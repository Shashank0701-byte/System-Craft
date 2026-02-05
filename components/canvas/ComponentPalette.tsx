import React from 'react';

type ComponentItem = {
  name: string;
  icon: string;
  color: string;
  colorDark: string;
  bgClass: string;
  textClass: string;
  darkTextClass: string;
  groupHoverBg: string;
};

const SECTIONS = [
  {
    title: 'Compute',
    items: [
      { name: 'Client', icon: 'smartphone', color: 'blue', bgClass: 'bg-blue-500/10', textClass: 'text-blue-500', darkTextClass: 'dark:text-blue-400', groupHoverBg: 'group-hover:bg-blue-500' },
      { name: 'Server', icon: 'dns', color: 'purple', bgClass: 'bg-purple-500/10', textClass: 'text-purple-500', darkTextClass: 'dark:text-purple-400', groupHoverBg: 'group-hover:bg-purple-500' },
      { name: 'Function', icon: 'functions', color: 'indigo', bgClass: 'bg-indigo-500/10', textClass: 'text-indigo-500', darkTextClass: 'dark:text-indigo-400', groupHoverBg: 'group-hover:bg-indigo-500' },
    ]
  },
  {
    title: 'Networking',
    items: [
      { name: 'LB', icon: 'alt_route', color: 'orange', bgClass: 'bg-orange-500/10', textClass: 'text-orange-500', darkTextClass: 'dark:text-orange-400', groupHoverBg: 'group-hover:bg-orange-500' },
      { name: 'CDN', icon: 'public', color: 'teal', bgClass: 'bg-teal-500/10', textClass: 'text-teal-500', darkTextClass: 'dark:text-teal-400', groupHoverBg: 'group-hover:bg-teal-500' },
    ]
  },
  {
    title: 'Storage',
    items: [
      { name: 'SQL', icon: 'database', color: 'emerald', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500', darkTextClass: 'dark:text-emerald-400', groupHoverBg: 'group-hover:bg-emerald-500' },
      { name: 'Cache', icon: 'bolt', color: 'red', bgClass: 'bg-red-500/10', textClass: 'text-red-500', darkTextClass: 'dark:text-red-400', groupHoverBg: 'group-hover:bg-red-500' },
      { name: 'Blob', icon: 'folder_zip', color: 'yellow', bgClass: 'bg-yellow-500/10', textClass: 'text-yellow-600', darkTextClass: 'dark:text-yellow-400', groupHoverBg: 'group-hover:bg-yellow-500' },
    ]
  },
  {
    title: 'Messaging',
    items: [
      { name: 'Queue', icon: 'mail', color: 'pink', bgClass: 'bg-pink-500/10', textClass: 'text-pink-500', darkTextClass: 'dark:text-pink-400', groupHoverBg: 'group-hover:bg-pink-500' },
      { name: 'Kafka', icon: 'hub', color: 'cyan', bgClass: 'bg-cyan-500/10', textClass: 'text-cyan-500', darkTextClass: 'dark:text-cyan-400', groupHoverBg: 'group-hover:bg-cyan-500' },
    ]
  }
];

export function ComponentPalette() {
  return (
    <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-border-dark bg-white dark:bg-sidebar-bg-dark z-10 shadow-xl flex-shrink-0">
      {/* Search */}
      <div className="p-4 border-b border-slate-200 dark:border-border-dark">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 group-focus-within:text-primary transition-colors" style={{ fontSize: '20px' }}>search</span>
          <input
            className="w-full bg-slate-50 dark:bg-[#121118] border border-slate-200 dark:border-[#2b2839] text-sm text-slate-900 dark:text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder-slate-400 dark:placeholder-slate-600 transition-all"
            placeholder="Search components..."
            type="text"
          />
        </div>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {section.title}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="group flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#2b2839] border border-transparent hover:border-slate-200 dark:hover:border-[#3f3b54] cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className={`size-8 flex items-center justify-center rounded ${item.bgClass} ${item.textClass} ${item.darkTextClass} ${item.groupHoverBg} group-hover:text-white transition-colors`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#121118]">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
          <span>Library v2.4</span>
          <span className="cursor-pointer hover:text-primary">Docs</span>
        </div>
      </div>
    </aside>
  );
}
