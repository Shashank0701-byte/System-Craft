'use client';

import { useCanvasPanels } from './CanvasPanelsContext';

const STORAGE_TYPES = new Set(['SQL', 'NoSQL', 'Blob', 'Cache', 'Search', 'GraphDB']);
const SHARDING_TYPES = new Set(['SQL', 'NoSQL', 'Search', 'GraphDB']);
const REPLICA_TYPES = new Set(['SQL', 'NoSQL', 'Cache', 'Search', 'GraphDB', 'Server', 'Function', 'Worker']);

const TYPE_ICON_COLOR: Record<string, string> = {
  SQL: 'text-emerald-500', NoSQL: 'text-green-500', Cache: 'text-red-500',
  Blob: 'text-yellow-500', Server: 'text-purple-500', Function: 'text-indigo-500',
  LB: 'text-orange-500', Queue: 'text-pink-500', Kafka: 'text-cyan-500',
  CDN: 'text-teal-500', Gateway: 'text-amber-500', Auth: 'text-sky-500',
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
    return 'Synchronous replication may introduce significant latency to write operations.';
  }
  if (type === 'SQL' && consistencyModel === 'Eventual Consistency') {
    return 'Eventual consistency on a relational DB may cause stale reads.';
  }
  return null;
}

export default function PropertiesPanel() {
  const { rightOpen, closeAll, selectedNode, getNodeConfig, updateNodeConfig } = useCanvasPanels();

  const config = selectedNode ? getNodeConfig(selectedNode.id) : null;
  const type = selectedNode?.type ?? '';
  const showStorage = STORAGE_TYPES.has(type);
  const showSharding = SHARDING_TYPES.has(type);
  const showReplicas = REPLICA_TYPES.has(type);
  const warning = config ? latencyWarning(type, config.readReplicas, config.consistencyModel) : null;
  const iconColor = TYPE_ICON_COLOR[type] ?? 'text-slate-400';
  const subtitle = TYPE_SUBTITLE[type] ?? type;

  const panelContent = selectedNode && config ? (
    <>
      <div className="p-5 border-b border-slate-200 dark:border-border-dark flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`material-symbols-outlined ${iconColor}`} style={{ fontSize: '20px' }}>
              {selectedNode.icon}
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
              {selectedNode.label || selectedNode.type}
            </h3>
          </div>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capacity Planning</label>
          <div className="bg-slate-50 dark:bg-[#121118] p-3 rounded-lg border border-slate-200 dark:border-[#2b2839]">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Instances</span>
              <span className="text-sm font-bold text-primary">{config.nodeCount}</span>
            </div>
            <input
              className="w-full h-1.5 bg-slate-200 dark:bg-[#2b2839] rounded-lg appearance-none cursor-pointer accent-primary"
              max="10" min="1" type="range"
              value={config.nodeCount}
              onChange={e => updateNodeConfig(selectedNode.id, { nodeCount: Number(e.target.value) })}
            />
            <div className="flex justify-between mt-1 text-[10px] text-slate-400">
              <span>1</span><span>10</span>
            </div>
          </div>
          {showStorage && (
            <div className="bg-slate-50 dark:bg-[#121118] p-3 rounded-lg border border-slate-200 dark:border-[#2b2839]">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Storage Size</span>
                <span className="text-xs text-slate-500">{storageLabel(config.storageGb)}</span>
              </div>
              <input
                className="w-full h-1.5 bg-slate-200 dark:bg-[#2b2839] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                max="2000" min="10" step="10" type="range"
                value={config.storageGb}
                onChange={e => updateNodeConfig(selectedNode.id, { storageGb: Number(e.target.value) })}
              />
              <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                <span>10 GB</span><span>2 TB</span>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-slate-200 dark:bg-border-dark" />

        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration</label>
          {showReplicas && (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Read Replicas</span>
                <p className="text-xs text-slate-500">Distribute read traffic</p>
              </div>
              <button
                onClick={() => updateNodeConfig(selectedNode.id, { readReplicas: !config.readReplicas })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${config.readReplicas ? 'bg-primary' : 'bg-slate-300 dark:bg-[#2b2839]'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.readReplicas ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}
          {showSharding && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900 dark:text-white">Sharding Strategy</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-slate-50 dark:bg-[#121118] border border-slate-200 dark:border-[#2b2839] text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                  value={config.shardingStrategy}
                  onChange={e => updateNodeConfig(selectedNode.id, { shardingStrategy: e.target.value })}
                >
                  <option>None</option>
                  <option>Consistent Hashing</option>
                  <option>Range Based</option>
                  <option>Directory Based</option>
                  <option>Hash Based</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none" style={{ fontSize: '20px' }}>expand_more</span>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900 dark:text-white">Consistency Model</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-slate-50 dark:bg-[#121118] border border-slate-200 dark:border-[#2b2839] text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                value={config.consistencyModel}
                onChange={e => updateNodeConfig(selectedNode.id, { consistencyModel: e.target.value })}
              >
                <option>Strong Consistency</option>
                <option>Eventual Consistency</option>
                <option>Causal Consistency</option>
                <option>Read-Your-Writes</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none" style={{ fontSize: '20px' }}>expand_more</span>
            </div>
          </div>
        </div>

        {warning && (
          <>
            <div className="h-px bg-slate-200 dark:bg-border-dark" />
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3 items-start">
              <span className="material-symbols-outlined text-yellow-500 shrink-0" style={{ fontSize: '20px' }}>warning</span>
              <div>
                <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500 mb-1">High Latency Risk</p>
                <p className="text-[11px] text-yellow-700 dark:text-yellow-600/80 leading-relaxed">{warning}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#121118]">
        <p className="text-[10px] text-slate-500 text-center">
          {config.nodeCount} instance{config.nodeCount !== 1 ? 's' : ''}
          {showStorage ? ` · ${storageLabel(config.storageGb)}` : ''}
          {config.readReplicas ? ' · replicated' : ''}
        </p>
      </div>
    </>
  ) : (
    <>
      <div className="p-5 border-b border-slate-200 dark:border-border-dark">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Properties</h3>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">touch_app</span>
        <p className="text-sm font-medium text-slate-400 mb-1">No component selected</p>
        <p className="text-xs text-slate-600 leading-relaxed">Click any node on the canvas to configure its properties.</p>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex w-80 flex-col border-l border-slate-200 dark:border-border-dark bg-white dark:bg-sidebar-bg-dark z-20 shadow-xl flex-shrink-0">
        {panelContent}
      </aside>
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
          <aside className="md:hidden fixed inset-y-0 right-0 z-40 w-80 max-w-[90vw] flex flex-col bg-white dark:bg-sidebar-bg-dark border-l border-slate-200 dark:border-border-dark shadow-2xl animate-slide-in-right">
            {panelContent}
          </aside>
        </>
      )}
    </>
  );
}
