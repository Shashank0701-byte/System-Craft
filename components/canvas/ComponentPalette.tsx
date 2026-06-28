'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCanvasPanels } from './CanvasPanelsContext';

type ComponentItem = {
  name: string;
  icon: string;
};

type Section = {
  title: string;
  items: ComponentItem[];
};

const SECTIONS: Section[] = [
  {
    title: 'Compute',
    items: [
      { name: 'Client', icon: 'smartphone' },
      { name: 'Server', icon: 'dns' },
      { name: 'Function', icon: 'functions' },
      { name: 'Worker', icon: 'precision_manufacturing' },
      { name: 'Container', icon: 'inventory_2' },
      { name: 'Gateway', icon: 'router' },
    ]
  },
  {
    title: 'Networking',
    items: [
      { name: 'LB', icon: 'alt_route' },
      { name: 'CDN', icon: 'public' },
      { name: 'DNS', icon: 'language' },
      { name: 'Firewall', icon: 'local_fire_department' },
      { name: 'Proxy', icon: 'vpn_lock' },
    ]
  },
  {
    title: 'Storage',
    items: [
      { name: 'SQL', icon: 'database' },
      { name: 'NoSQL', icon: 'view_cozy' },
      { name: 'Cache', icon: 'bolt' },
      { name: 'Blob', icon: 'folder_zip' },
      { name: 'Search', icon: 'saved_search' },
      { name: 'GraphDB', icon: 'share' },
    ]
  },
  {
    title: 'Messaging',
    items: [
      { name: 'Queue', icon: 'mail' },
      { name: 'Kafka', icon: 'hub' },
      { name: 'PubSub', icon: 'cell_tower' },
      { name: 'WebSocket', icon: 'sync_alt' },
    ]
  },
  {
    title: 'Observability',
    items: [
      { name: 'Logger', icon: 'receipt_long' },
      { name: 'Metrics', icon: 'monitoring' },
      { name: 'Tracer', icon: 'timeline' },
    ]
  },
  {
    title: 'Security',
    items: [
      { name: 'Auth', icon: 'passkey' },
      { name: 'WAF', icon: 'shield' },
      { name: 'Vault', icon: 'lock' },
    ]
  }
];

export function ComponentPalette() {
  const { leftOpen, closeAll, activeView } = useCanvasPanels();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Keep track of collapsed states for sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  // Track recently used components (limit to 3)
  const [recentlyUsed, setRecentlyUsed] = useState<ComponentItem[]>([
    { name: 'Client', icon: 'smartphone' },
    { name: 'LB', icon: 'alt_route' },
    { name: 'Server', icon: 'dns' }
  ]);

  if (activeView === 'whiteboard') return null;

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleDragStart = (item: ComponentItem, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: item.name,
      icon: item.icon,
      color: 'cyan',
    }));
    e.dataTransfer.effectAllowed = 'copy';

    // Add to recently used
    setRecentlyUsed(prev => {
      const filtered = prev.filter(p => p.name !== item.name);
      return [item, ...filtered].slice(0, 3);
    });
  };

  const filteredSections = SECTIONS.map(section => {
    const items = section.items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  const paletteContent = (
    <div className="flex flex-col h-full bg-[#060810] border-r border-white/[0.04] select-none relative">
      {/* Noise background */}
      <div className="noise-overlay absolute inset-0 pointer-events-none opacity-[0.02]" />

      {/* Header Info */}
      <div className="p-3.5 border-b border-white/[0.04] z-10 flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/50">Component Catalog</span>
        <span className="text-[8px] font-mono tracking-wider text-cyan-400 bg-cyan-400/5 px-1 py-0.5 rounded border border-cyan-400/10 uppercase">READY</span>
      </div>

      {/* Command Search */}
      <div className="p-3 border-b border-white/[0.04] z-10">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-white/30 text-[16px] pointer-events-none">search</span>
          <input
            className="w-full bg-black/40 border border-white/[0.05] focus:border-white/20 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] text-[11px] font-mono tracking-wide text-white rounded-md pl-9 pr-3 py-1.5 placeholder-white/40 outline-none transition-all duration-200"
            placeholder="Search catalog..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 z-10">
        
        {/* Recently Used (only show if no search query) */}
        {!searchQuery && recentlyUsed.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/30 px-2 py-1.5">RECENTLY USED</p>
            <div className="flex flex-col space-y-0.5">
              {recentlyUsed.map((item) => (
                <div
                  key={`recent-${item.name}`}
                  draggable
                  onDragStart={(e) => handleDragStart(item, e)}
                  className="group flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-white/[0.02] text-white/40 hover:text-white cursor-grab active:cursor-grabbing transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                  <span className="text-[10px] font-mono tracking-wide">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Catalog Sections */}
        {filteredSections.map((section) => {
          const isCollapsed = !!collapsedSections[section.title];
          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/30 px-2 py-1.5 hover:text-white/60 transition-colors text-left"
              >
                <span>{section.title}</span>
                <span className="material-symbols-outlined text-[12px] transform transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>
              
              {!isCollapsed && (
                <div className="flex flex-col space-y-0.5 animate-in fade-in duration-200">
                  {section.items.map((item) => (
                    <div
                      key={item.name}
                      draggable
                      onDragStart={(e) => handleDragStart(item, e)}
                      className="group flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-white/[0.02] text-white/40 hover:text-white cursor-grab active:cursor-grabbing transition-colors duration-200"
                    >
                      <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                      <span className="text-[10px] font-mono tracking-wide">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.04] bg-[#080a12] flex items-center justify-between text-[7px] font-mono tracking-widest text-white/25 uppercase z-10">
        <span>CATALOG v2.4</span>
        <Link href="/docs" className="hover:text-white transition-colors">DOCS</Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Fixed sidebar */}
      <aside className="hidden md:flex w-48 flex-col border-r border-white/[0.04] bg-[#060810] z-10 flex-shrink-0">
        {paletteContent}
      </aside>

      {/* Mobile: Slide-in overlay */}
      {leftOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={closeAll}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeAll(); } }}
            role="button"
            tabIndex={0}
            aria-label="Close panel"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-40 w-48 flex flex-col bg-[#060810] border-r border-white/[0.04] shadow-2xl animate-slide-in-left">
            {paletteContent}
          </aside>
        </>
      )}
    </>
  );
}
