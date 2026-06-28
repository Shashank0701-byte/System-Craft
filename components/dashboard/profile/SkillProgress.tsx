"use client";

interface SkillProgressProps {
    metrics: Record<string, number>;
}

const CATEGORIES = [
    {
        title: 'System Design Foundation',
        items: [
            { key: 'architecturesCreated', label: 'Architectures Drafted', max: 50 },
            { key: 'referenceArchitecturesCompleted', label: 'References Studied', max: 25 },
            { key: 'interviewsCompleted', label: 'AI Interviews Finished', max: 100 },
        ]
    },
    {
        title: 'Infrastructure Proficiency',
        items: [
            { key: 'cacheImplementations', label: 'Caching Strategies', max: 20 },
            { key: 'loadBalancerImplementations', label: 'Load Balancing', max: 20 },
            { key: 'databaseImplementations', label: 'Database Modeling', max: 30 },
            { key: 'messagingImplementations', label: 'Message Queues / PubSub', max: 15 },
        ]
    },
    {
        title: 'Reliability & Scalability',
        items: [
            { key: 'faultToleranceImplementations', label: 'Fault Tolerance', max: 15 },
            { key: 'chaosConstraintsAddressed', label: 'Chaos Constraints Resolved', max: 50 },
            { key: 'circuitBreakerApplications', label: 'Circuit Breakers', max: 10 },
            { key: 'rateLimitingApplications', label: 'Rate Limiting', max: 10 },
        ]
    }
];

export function SkillProgress({ metrics }: SkillProgressProps) {
    const renderProgressBar = (value: number, max: number) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));
        const filledBlocks = Math.floor(percentage / 10);
        const emptyBlocks = 10 - filledBlocks;
        
        const filled = '█'.repeat(filledBlocks);
        const empty = '░'.repeat(emptyBlocks);
        
        return (
            <span className="font-mono text-[10px] tracking-[0.1em]">
                <span className="text-cyan-400">{filled}</span>
                <span className="text-white/10">{empty}</span>
            </span>
        );
    };

    return (
        <div className="w-full flex flex-col p-6 rounded-2xl bg-[#0c0d16]/75 backdrop-blur-xl border border-white/[0.05]">
            <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[16px] text-white/40">radar</span>
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-white/80">Skill Telemetry</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {CATEGORIES.map((category) => (
                    <div key={category.title} className="flex flex-col gap-4">
                        <h4 className="text-[10px] font-mono tracking-widest uppercase text-white/30 border-b border-white/[0.04] pb-2">
                            {category.title}
                        </h4>
                        
                        <div className="flex flex-col gap-3">
                            {category.items.map((item) => {
                                const val = metrics[item.key] || 0;
                                return (
                                    <div key={item.key} className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono uppercase text-white/70">{item.label}</span>
                                            <span className="text-[9px] font-mono tracking-widest text-cyan-400/80">{val} / {item.max}</span>
                                        </div>
                                        <div className="w-full">
                                            {renderProgressBar(val, item.max)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
