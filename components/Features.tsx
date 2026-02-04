import React from 'react';

const features = [
  {
    icon: 'code',
    color: 'text-[#61DAFB]',
    bg: 'bg-[#61DAFB]/10',
    title: 'Frontend Services',
    description: 'Simulate client-side rendering bottlenecks and CDN caching strategies for single-page applications.'
  },
  {
    icon: 'bolt',
    color: 'text-[#DC382D]',
    bg: 'bg-[#DC382D]/10',
    title: 'Caching & Redis',
    description: 'Implement distributed caching layers. Handle cache stampedes and eviction policies in real-time.'
  },
  {
    icon: 'hub',
    color: 'text-white',
    bg: 'bg-[#ffffff]/10',
    title: 'Event Streaming',
    description: 'Design resilient event-driven architectures using Kafka topics, partitions, and consumer groups.'
  },
  {
    icon: 'database',
    color: 'text-[#336791]',
    bg: 'bg-[#336791]/10',
    title: 'Sharded Databases',
    description: 'Master horizontal scaling. Configure shard keys and handle resharding without downtime.'
  },
  {
    icon: 'lock',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    title: 'Security Groups',
    description: 'Configure VPCs, subnets, and firewalls. secure your architecture against common attack vectors.'
  },
  {
    icon: 'monitoring',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    title: 'Real-time Metrics',
    description: 'Visual feedback on latency, throughput, and error rates as you modify your system design.'
  }
];

export function Features() {
  return (
    <section className="border-t border-white/5 bg-background-dark py-24 relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 items-start justify-between mb-16">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Supported Technologies</h2>
            <p className="text-slate-400 text-lg">Practice with industry-standard tools. Drag and drop components onto the canvas and simulate real-world traffic patterns.</p>
          </div>
          <button className="flex-shrink-0 text-sm font-bold text-primary hover:text-white transition-colors flex items-center gap-1 group">
            View all 50+ integrations
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="group relative rounded-xl border border-white/5 bg-surface-dark p-6 hover:border-primary/30 transition-all duration-300">
              <div className={`mb-4 inline-flex items-center justify-center rounded-lg ${feature.bg} p-3 ${feature.color}`}>
                <span className="material-symbols-outlined">{feature.icon}</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-white group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
