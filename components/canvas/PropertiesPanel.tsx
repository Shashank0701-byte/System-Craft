'use client';

import { useState } from 'react';
import { useCanvasPanels } from './CanvasPanelsContext';

const STORAGE_TYPES = new Set(['SQL', 'NoSQL', 'Blob', 'Cache', 'Search', 'GraphDB']);
const SHARDING_TYPES = new Set(['SQL', 'NoSQL', 'Search', 'GraphDB']);
const REPLICA_TYPES = new Set(['SQL', 'NoSQL', 'Cache', 'Search', 'GraphDB', 'Server', 'Function', 'Worker']);

const TYPE_ICON_COLOR: Record<string, string> = {
  SQL: 'text-emerald-400', NoSQL: 'text-green-400', Cache: 'text-red-400',
  Blob: 'text-yellow-400', Server: 'text-purple-400', Function: 'text-indigo-400',
  LB: 'text-orange-400', Queue: 'text-pink-400', Kafka: 'text-cyan-400',
  CDN: 'text-teal-400', Gateway: 'text-amber-400', Auth: 'text-sky-400',
};

const TYPE_SUBTITLE: Record<string, string> = {
  SQL: 'Relational Database', NoSQL: 'Document Store', Cache: 'In-Memory Cache',
  Blob: 'Object Storage', Server: 'Application Server', Function: 'Serverless Function',
  LB: 'Load Balancer', Queue: 'Message Queue', Kafka: 'Event Stream',
  CDN: 'Content Delivery Network', Gateway: 'API Gateway', Auth: 'Auth Service',
  Worker: 'Background Worker', Container: 'Container', DNS: 'DNS',
  Firewall: 'Firewall', Proxy: 'Reverse Proxy', Search: 'Search Index',
  GraphDB: 'Graph Database', PubSub: 'Pub/Sub', WebSocket: 'WebSocket Server',
  Logger: 'Log Aggregator', Metrics: 'Metrics Collector', Tracer: 'Distributed Tracer',
  WAF: 'Web App Firewall', Vault: 'Secret Manager', Client: 'Client Application',
};

function storageLabel(gb: number): string {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  return `${gb} GB`;
}

function latencyWarning(type: string, readReplicas: boolean, consistencyModel: string): string | null {
  if (readReplicas && consistencyModel === 'Strong Consistency' && STORAGE_TYPES.has(type)) {
    return 'Synchronous replication may introduce latency to write operations.';
  }
  if (type === 'SQL' && consistencyModel === 'Eventual Consistency') {
    return 'Eventual consistency on relational database may cause stale reads.';
  }
  return null;
}

export default function PropertiesPanel() {
  const { rightOpen, closeAll, selectedNode, getNodeConfig, updateNodeConfig, activeView } = useCanvasPanels();

  // Collapsed sections local state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    general: false,
    networking: true,
    scaling: true,
    storage: false,
    security: true,
    observability: true,
    simulation: true,
  });

  if (activeView === 'whiteboard') return null;

  const toggleSection = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const config = selectedNode ? getNodeConfig(selectedNode.id) : null;
  const type = selectedNode?.type ?? '';
  const showStorage = STORAGE_TYPES.has(type);
  const showSharding = SHARDING_TYPES.has(type);
  const showReplicas = REPLICA_TYPES.has(type);
  const warning = config ? latencyWarning(type, config.readReplicas, config.consistencyModel) : null;
  const iconColor = TYPE_ICON_COLOR[type] ?? 'text-white/40';
  const subtitle = TYPE_SUBTITLE[type] ?? type;

  const renderSectionHeader = (key: string, label: string) => {
    const isCollapsed = collapsed[key];
    return (
      <button
        onClick={() => toggleSection(key)}
        className="w-full flex items-center justify-between py-1.5 text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/30 hover:text-white/70 transition-colors text-left select-none border-b border-white/[0.02] mb-1.5 focus:outline-none focus:text-white/70"
      >
        <span>{label}</span>
        <span className="material-symbols-outlined text-[10px] transform transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>
    );
  };

  const panelContent = selectedNode && config ? (
    <div className="flex flex-col h-full bg-[#060810] select-none relative animate-in fade-in duration-300">
      {/* Noise background */}
      <div className="noise-overlay absolute inset-0 pointer-events-none opacity-[0.02]" />

      {/* Title block */}
      <div className="p-3.5 border-b border-white/[0.04] z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-6 rounded-md bg-[#080a12] border border-white/[0.06] flex items-center justify-center shadow-inner">
            <span className={`material-symbols-outlined text-[14px] ${iconColor}`}>
              {selectedNode.icon}
            </span>
          </div>
          <div>
            <h3 className="text-[10px] font-mono font-bold tracking-widest text-white/90 uppercase truncate max-w-[130px]">
              {selectedNode.label || selectedNode.type}
            </h3>
            <p className="text-[7px] font-mono tracking-widest text-white/30 uppercase mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={closeAll}
          className="md:hidden p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>

      {/* Main scrolling inspector content */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 z-10 custom-scrollbar">
        
        {/* GROUP 1: General */}
        <div className="space-y-1">
          {renderSectionHeader('general', '1. General')}
          {!collapsed.general && (
            <div className="space-y-2.5 font-mono text-[9px] uppercase tracking-wider">
              {/* Instances */}
              <div className="bg-[#080a12] border border-white/[0.04] p-2.5 rounded-md space-y-2 transition-colors hover:border-white/[0.08]">
                <div className="flex justify-between text-white/50">
                  <label htmlFor="replicas-slider" className="cursor-pointer">Replicas</label>
                  <span className="text-cyan-400 font-bold">{config.nodeCount} / 10</span>
                </div>
                <input
                  id="replicas-slider"
                  className="w-full h-1 bg-black/40 rounded appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  max="10" min="1" type="range"
                  value={config.nodeCount}
                  onChange={e => updateNodeConfig(selectedNode.id, { nodeCount: Number(e.target.value) })}
                />
              </div>

              {/* Storage size slider */}
              {showStorage && (
                <div className="bg-[#080a12] border border-white/[0.04] p-2.5 rounded-md space-y-2 transition-colors hover:border-white/[0.08]">
                  <div className="flex justify-between text-white/50">
                    <label htmlFor="storage-slider" className="cursor-pointer">Storage</label>
                    <span className="text-cyan-400 font-bold">{storageLabel(config.storageGb)}</span>
                  </div>
                  <input
                    id="storage-slider"
                    className="w-full h-1 bg-black/40 rounded appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    max="2000" min="10" step="10" type="range"
                    value={config.storageGb}
                    onChange={e => updateNodeConfig(selectedNode.id, { storageGb: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* GROUP 2: Networking */}
        <div className="space-y-1">
          {renderSectionHeader('networking', '2. Networking')}
          {!collapsed.networking && (
            <div className="space-y-1.5 font-mono text-[9px] uppercase tracking-wider text-white/40">
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>Interface</span>
                <span className="text-white/60">0.0.0.0:8080</span>
              </div>
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>Protocol</span>
                <span className="text-white/60">gRPC / HTTP2</span>
              </div>
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>TLS</span>
                <span className="text-cyan-400/80">STRICT</span>
              </div>
            </div>
          )}
        </div>

        {/* GROUP 3: Scaling */}
        <div className="space-y-1">
          {renderSectionHeader('scaling', '3. Scaling')}
          {!collapsed.scaling && (
            <div className="space-y-1.5 font-mono text-[9px] uppercase tracking-wider text-white/40">
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>Engine</span>
                <span className="text-white/60">K8s HPA</span>
              </div>
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>Target CPU</span>
                <span className="text-white/60">75%</span>
              </div>
            </div>
          )}
        </div>

        {/* GROUP 4: Storage Policies */}
        {(showReplicas || showSharding) && (
          <div className="space-y-1">
            {renderSectionHeader('storage', '4. Storage')}
            {!collapsed.storage && (
              <div className="space-y-2.5 font-mono text-[9px] uppercase tracking-wider">
                {showReplicas && (
                  <div className="flex items-center justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-2 rounded-md">
                    <div className="flex flex-col">
                      <span id="read-replicas-label" className="text-white/60">Read Replicas</span>
                      <span className="text-[7px] text-white/25 mt-0.5">DISTRIBUTE READS</span>
                    </div>
                    <button
                      role="switch"
                      aria-checked={config.readReplicas}
                      aria-labelledby="read-replicas-label"
                      onClick={() => updateNodeConfig(selectedNode.id, { readReplicas: !config.readReplicas })}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:ring-offset-1 focus:ring-offset-[#080a12] cursor-pointer ${config.readReplicas ? 'bg-cyan-500' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.readReplicas ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                )}

                {showSharding && (
                  <div className="space-y-1">
                    <label htmlFor="sharding-strategy-select" className="text-white/40 px-1 text-[7px] tracking-widest cursor-pointer">Strategy</label>
                    <div className="relative">
                      <select
                        id="sharding-strategy-select"
                        className="w-full appearance-none bg-black/20 border border-white/[0.04] hover:border-white/[0.08] text-white/80 rounded-md px-2.5 py-1.5 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 outline-none cursor-pointer uppercase text-[9px] font-mono tracking-wider transition-all"
                        value={config.shardingStrategy}
                        onChange={e => updateNodeConfig(selectedNode.id, { shardingStrategy: e.target.value })}
                      >
                        <option>None</option>
                        <option>Consistent Hashing</option>
                        <option>Range Based</option>
                        <option>Directory Based</option>
                        <option>Hash Based</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1.5 text-white/30 pointer-events-none text-[14px]">expand_more</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="consistency-select" className="text-white/40 px-1 text-[7px] tracking-widest cursor-pointer">Consistency</label>
                  <div className="relative">
                    <select
                      id="consistency-select"
                      className="w-full appearance-none bg-black/20 border border-white/[0.04] hover:border-white/[0.08] text-white/80 rounded-md px-2.5 py-1.5 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 outline-none cursor-pointer uppercase text-[9px] font-mono tracking-wider transition-all"
                      value={config.consistencyModel}
                      onChange={e => updateNodeConfig(selectedNode.id, { consistencyModel: e.target.value })}
                    >
                      <option>Strong Consistency</option>
                      <option>Eventual Consistency</option>
                      <option>Causal Consistency</option>
                      <option>Read-Your-Writes</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1.5 text-white/30 pointer-events-none text-[14px]">expand_more</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GROUP 5: Security */}
        <div className="space-y-1">
          {renderSectionHeader('security', '5. Security')}
          {!collapsed.security && (
            <div className="space-y-1.5 font-mono text-[9px] uppercase tracking-wider text-white/40">
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>Encryption</span>
                <span className="text-cyan-400/80">AES-GCM</span>
              </div>
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>WAF</span>
                <span className="text-white/60">ACTIVE</span>
              </div>
            </div>
          )}
        </div>

        {/* GROUP 6: Observability */}
        <div className="space-y-1">
          {renderSectionHeader('observability', '6. Telemetry')}
          {!collapsed.observability && (
            <div className="space-y-1.5 font-mono text-[9px] uppercase tracking-wider text-white/40">
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>Level</span>
                <span className="text-white/60">INFO</span>
              </div>
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>Scrape</span>
                <span className="text-white/60">15s</span>
              </div>
            </div>
          )}
        </div>

        {/* GROUP 7: Simulation */}
        <div className="space-y-1">
          {renderSectionHeader('simulation', '7. Cost')}
          {!collapsed.simulation && (
            <div className="space-y-1.5 font-mono text-[9px] uppercase tracking-wider text-white/40">
              <div className="flex justify-between bg-[#080a12] border border-white/[0.04] px-2.5 py-1.5 rounded-md">
                <span>Sandbox Cost</span>
                <span className="text-white/60">$0.024/Hr</span>
              </div>
            </div>
          )}
        </div>

        {/* Warnings */}
        {warning && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-md flex gap-2 items-start select-none">
            <span className="material-symbols-outlined text-red-400 shrink-0 text-[14px]">warning</span>
            <div className="font-mono text-[8px] uppercase tracking-widest text-red-400 leading-normal">
              <p className="font-bold mb-0.5">LATENCY PENALTY</p>
              <p className="text-white/50">{warning}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer details summary */}
      <div className="p-2.5 bg-[#080a12] border-t border-white/[0.04] text-center font-mono text-[7px] tracking-widest text-white/20 uppercase z-10">
        <span>{config.nodeCount} NODES</span>
        {showStorage && ` · ${storageLabel(config.storageGb)}`}
        {config.readReplicas && ' · REPLICATED'}
      </div>
    </div>
  ) : (
    <div className="flex flex-col h-full bg-[#060810] select-none relative animate-in fade-in duration-300">
      <div className="noise-overlay absolute inset-0 pointer-events-none opacity-[0.02]" />
      <div className="p-3.5 border-b border-white/[0.04] z-10 flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/40">Inspector</span>
      </div>
      <div className="flex-1 flex flex-col p-4 z-10 overflow-y-auto">
        <div className="flex flex-col items-center justify-center text-center mb-6 mt-2">
          <div className="size-10 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-xl text-white/30">touch_app</span>
          </div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/60 mb-1">No Node Selected</p>
          <p className="text-[8px] font-mono tracking-wider text-white/30 max-w-[180px] leading-relaxed">Select a component on the canvas to configure its properties.</p>
        </div>
        
        <div className="space-y-4 opacity-[0.15] pointer-events-none select-none grayscale blur-[0.5px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
              <span className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/40">General</span>
            </div>
            <div className="bg-[#080a12] border border-white/[0.04] p-3 rounded-md h-10 flex items-center justify-between">
               <div className="w-1/2 h-1.5 bg-white/10 rounded"></div>
               <div className="w-1/4 h-1.5 bg-cyan-400/20 rounded"></div>
            </div>
            <div className="bg-[#080a12] border border-white/[0.04] p-3 rounded-md h-10 flex items-center justify-between">
               <div className="w-2/3 h-1.5 bg-white/10 rounded"></div>
               <div className="w-1/5 h-1.5 bg-cyan-400/20 rounded"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
              <span className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/40">Networking</span>
            </div>
            <div className="bg-[#080a12] border border-white/[0.04] p-3 rounded-md h-8 flex items-center justify-between">
              <div className="w-1/3 h-1.5 bg-white/10 rounded"></div>
              <div className="w-1/3 h-1.5 bg-white/5 rounded"></div>
            </div>
            <div className="bg-[#080a12] border border-white/[0.04] p-3 rounded-md h-8 flex items-center justify-between">
              <div className="w-1/4 h-1.5 bg-white/10 rounded"></div>
              <div className="w-2/5 h-1.5 bg-white/5 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Fixed sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-l border-white/[0.04] bg-[#060810] z-10 flex-shrink-0 transition-all duration-300">
        {panelContent}
      </aside>
      
      {/* Mobile: Slide-in overlay */}
      {rightOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={closeAll}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeAll(); } }}
            role="button"
            tabIndex={0}
            aria-label="Close panel"
          />
          <aside className="md:hidden fixed inset-y-0 right-0 z-40 w-60 flex flex-col bg-[#060810] border-l border-white/[0.04] shadow-2xl animate-slide-in-right">
            {panelContent}
          </aside>
        </>
      )}
    </>
  );
}
