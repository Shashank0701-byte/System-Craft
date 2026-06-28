import type { IUserMetricsData } from './metrics';

export type AchievementCategory =
  | 'learning'
  | 'interview'
  | 'infrastructure'
  | 'distributed_systems'
  | 'reliability'
  | 'scalability'
  | 'reference_architectures'
  | 'secret';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface AchievementTierDef {
  tier: AchievementTier;
  /** threshold value required on the tracked metric */
  threshold: number;
  xpReward: number;
}

export interface AchievementDef {
  /** Unique stable identifier — never change this after release */
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string; // material-symbols name
  /** Which user metric drives progress for this achievement */
  metricKey: keyof IUserMetricsData;
  tiers: AchievementTierDef[];
  /** Hidden until unlocked */
  hidden: boolean;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  // ─── Learning Progression ───────────────────────────────────────────────────
  {
    id: 'first_architecture',
    title: 'First Architecture',
    description: 'Create your first system design.',
    category: 'learning',
    icon: 'architecture',
    metricKey: 'architecturesCreated',
    hidden: false,
    tiers: [{ tier: 'bronze', threshold: 1, xpReward: 50 }],
  },
  {
    id: 'architect_progression',
    title: 'Architect',
    description: 'Build architectures to demonstrate your design depth.',
    category: 'learning',
    icon: 'schema',
    metricKey: 'architecturesCreated',
    hidden: false,
    tiers: [
      { tier: 'bronze',   threshold: 10,  xpReward: 100 },
      { tier: 'silver',   threshold: 50,  xpReward: 250 },
      { tier: 'gold',     threshold: 100, xpReward: 500 },
      { tier: 'platinum', threshold: 250, xpReward: 1000 },
    ],
  },

  // ─── Interview Performance ───────────────────────────────────────────────────
  {
    id: 'first_interview',
    title: 'First Interview',
    description: 'Complete your first system design interview.',
    category: 'interview',
    icon: 'psychology',
    metricKey: 'interviewsCompleted',
    hidden: false,
    tiers: [{ tier: 'bronze', threshold: 1, xpReward: 75 }],
  },
  {
    id: 'interview_veteran',
    title: 'Interview Veteran',
    description: 'Complete multiple system design interviews.',
    category: 'interview',
    icon: 'military_tech',
    metricKey: 'interviewsCompleted',
    hidden: false,
    tiers: [
      { tier: 'bronze',   threshold: 5,   xpReward: 150 },
      { tier: 'silver',   threshold: 20,  xpReward: 300 },
      { tier: 'gold',     threshold: 50,  xpReward: 600 },
      { tier: 'platinum', threshold: 100, xpReward: 1200 },
      { tier: 'diamond',  threshold: 200, xpReward: 2500 },
    ],
  },
  {
    id: 'perfect_evaluation',
    title: 'Perfect Evaluation',
    description: 'Score 100 on a system design interview.',
    category: 'interview',
    icon: 'stars',
    metricKey: 'perfectScores',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 1, xpReward: 200 },
      { tier: 'silver', threshold: 5, xpReward: 500 },
      { tier: 'gold',   threshold: 15, xpReward: 1000 },
    ],
  },
  {
    id: 'high_average',
    title: '90+ Average',
    description: 'Maintain a 90+ average score across at least 5 interviews.',
    category: 'interview',
    icon: 'trending_up',
    metricKey: 'highAverageUnlocked',
    hidden: false,
    tiers: [{ tier: 'gold', threshold: 1, xpReward: 400 }],
  },
  {
    id: 'consistent_performer',
    title: 'Consistent Performer',
    description: 'Score 80+ on 10 consecutive interviews.',
    category: 'interview',
    icon: 'stacked_line_chart',
    metricKey: 'consistentPerformerStreak',
    hidden: false,
    tiers: [
      { tier: 'silver', threshold: 5,  xpReward: 250 },
      { tier: 'gold',   threshold: 10, xpReward: 500 },
    ],
  },
  {
    id: 'comeback',
    title: 'Comeback',
    description: 'Improve your score by 20+ points compared to a previous attempt.',
    category: 'interview',
    icon: 'autorenew',
    metricKey: 'comebackUnlocked',
    hidden: false,
    tiers: [{ tier: 'silver', threshold: 1, xpReward: 150 }],
  },

  // ─── Infrastructure Skills ───────────────────────────────────────────────────
  {
    id: 'cache_expert',
    title: 'Cache Expert',
    description: 'Correctly implement caching patterns in AI-reviewed designs.',
    category: 'infrastructure',
    icon: 'memory',
    metricKey: 'cacheImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze',   threshold: 5,   xpReward: 100 },
      { tier: 'silver',   threshold: 15,  xpReward: 200 },
      { tier: 'gold',     threshold: 40,  xpReward: 400 },
      { tier: 'platinum', threshold: 80,  xpReward: 800 },
      { tier: 'diamond',  threshold: 150, xpReward: 1500 },
    ],
  },
  {
    id: 'load_balancer_specialist',
    title: 'Load Balancer Specialist',
    description: 'Use load balancers correctly across multiple AI-reviewed designs.',
    category: 'infrastructure',
    icon: 'balance',
    metricKey: 'loadBalancerImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze',   threshold: 5,   xpReward: 100 },
      { tier: 'silver',   threshold: 15,  xpReward: 200 },
      { tier: 'gold',     threshold: 40,  xpReward: 400 },
      { tier: 'platinum', threshold: 80,  xpReward: 800 },
      { tier: 'diamond',  threshold: 150, xpReward: 1500 },
    ],
  },
  {
    id: 'database_architect',
    title: 'Database Architect',
    description: 'Design and validate database tiers across multiple systems.',
    category: 'infrastructure',
    icon: 'storage',
    metricKey: 'databaseImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze',   threshold: 5,   xpReward: 100 },
      { tier: 'silver',   threshold: 15,  xpReward: 200 },
      { tier: 'gold',     threshold: 40,  xpReward: 400 },
      { tier: 'platinum', threshold: 80,  xpReward: 800 },
      { tier: 'diamond',  threshold: 150, xpReward: 1500 },
    ],
  },
  {
    id: 'messaging_expert',
    title: 'Messaging Expert',
    description: 'Correctly implement message queues and async patterns.',
    category: 'infrastructure',
    icon: 'forum',
    metricKey: 'messagingImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze',   threshold: 5,  xpReward: 100 },
      { tier: 'silver',   threshold: 15, xpReward: 200 },
      { tier: 'gold',     threshold: 40, xpReward: 400 },
      { tier: 'platinum', threshold: 80, xpReward: 800 },
    ],
  },
  {
    id: 'cdn_professional',
    title: 'CDN Professional',
    description: 'Implement CDN layers in globally distributed designs.',
    category: 'infrastructure',
    icon: 'language',
    metricKey: 'cdnImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3,  xpReward: 100 },
      { tier: 'silver', threshold: 10, xpReward: 200 },
      { tier: 'gold',   threshold: 25, xpReward: 400 },
    ],
  },
  {
    id: 'api_gateway_specialist',
    title: 'API Gateway Specialist',
    description: 'Route traffic correctly through API gateway patterns.',
    category: 'infrastructure',
    icon: 'hub',
    metricKey: 'apiGatewayImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 5,  xpReward: 100 },
      { tier: 'silver', threshold: 15, xpReward: 200 },
      { tier: 'gold',   threshold: 40, xpReward: 400 },
    ],
  },
  {
    id: 'fault_tolerance_engineer',
    title: 'Fault Tolerance Engineer',
    description: 'Design systems that survive component failure.',
    category: 'infrastructure',
    icon: 'health_and_safety',
    metricKey: 'faultToleranceImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3,  xpReward: 150 },
      { tier: 'silver', threshold: 10, xpReward: 300 },
      { tier: 'gold',   threshold: 25, xpReward: 600 },
    ],
  },
  {
    id: 'event_driven_engineer',
    title: 'Event Driven Engineer',
    description: 'Apply asynchronous messaging patterns consistently.',
    category: 'infrastructure',
    icon: 'stream',
    metricKey: 'messagingImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 8, xpReward: 140 },
      { tier: 'silver', threshold: 25, xpReward: 300 },
      { tier: 'gold', threshold: 60, xpReward: 650 },
    ],
  },
  {
    id: 'storage_master',
    title: 'Storage Master',
    description: 'Use durable storage patterns across production-grade designs.',
    category: 'infrastructure',
    icon: 'inventory_2',
    metricKey: 'databaseImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 10, xpReward: 120 },
      { tier: 'silver', threshold: 30, xpReward: 260 },
      { tier: 'gold', threshold: 75, xpReward: 550 },
    ],
  },
  {
    id: 'security_architect',
    title: 'Security Architect',
    description: 'Design secure service boundaries and access control layers.',
    category: 'infrastructure',
    icon: 'shield_lock',
    metricKey: 'securityImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 160 },
      { tier: 'silver', threshold: 10, xpReward: 350 },
      { tier: 'gold', threshold: 25, xpReward: 700 },
    ],
  },
  {
    id: 'scalability_architect',
    title: 'Scalability Architect',
    description: 'Demonstrate scalable architecture decisions repeatedly.',
    category: 'infrastructure',
    icon: 'network_node',
    metricKey: 'globalInfrastructureDesigns',
    hidden: false,
    tiers: [
      { tier: 'silver', threshold: 3, xpReward: 220 },
      { tier: 'gold', threshold: 10, xpReward: 520 },
      { tier: 'platinum', threshold: 25, xpReward: 1100 },
    ],
  },

  // ─── Distributed Systems Concepts ───────────────────────────────────────────
  {
    id: 'cap_theorem',
    title: 'CAP Theorem',
    description: 'Correctly apply CAP theorem trade-offs in AI-reviewed designs.',
    category: 'distributed_systems',
    icon: 'device_hub',
    metricKey: 'capTheoremApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3,  xpReward: 150 },
      { tier: 'silver', threshold: 10, xpReward: 300 },
      { tier: 'gold',   threshold: 25, xpReward: 600 },
    ],
  },
  {
    id: 'eventual_consistency',
    title: 'Eventual Consistency',
    description: 'Apply eventual consistency trade-offs in distributed workflows.',
    category: 'distributed_systems',
    icon: 'sync',
    metricKey: 'eventualConsistencyApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 150 },
      { tier: 'silver', threshold: 10, xpReward: 300 },
      { tier: 'gold', threshold: 25, xpReward: 600 },
    ],
  },
  {
    id: 'idempotency_guardian',
    title: 'Idempotency',
    description: 'Design idempotent APIs and retry-safe write paths.',
    category: 'distributed_systems',
    icon: 'restart_alt',
    metricKey: 'idempotencyApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 140 },
      { tier: 'silver', threshold: 10, xpReward: 280 },
      { tier: 'gold', threshold: 25, xpReward: 560 },
    ],
  },
  {
    id: 'cqrs_architect',
    title: 'CQRS',
    description: 'Apply command-query separation where read/write paths diverge.',
    category: 'distributed_systems',
    icon: 'alt_route',
    metricKey: 'cqrsApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 2, xpReward: 170 },
      { tier: 'silver', threshold: 8, xpReward: 340 },
      { tier: 'gold', threshold: 20, xpReward: 680 },
    ],
  },
  {
    id: 'saga_orchestrator',
    title: 'Saga Pattern',
    description: 'Implement saga compensation flows for distributed transactions.',
    category: 'distributed_systems',
    icon: 'account_tree',
    metricKey: 'sagaPatternApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 2, xpReward: 170 },
      { tier: 'silver', threshold: 8, xpReward: 340 },
      { tier: 'gold', threshold: 20, xpReward: 680 },
    ],
  },
  {
    id: 'retry_strategist',
    title: 'Retry Strategy',
    description: 'Apply bounded retries and backoff under transient failures.',
    category: 'distributed_systems',
    icon: 'replay',
    metricKey: 'retryStrategyApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 130 },
      { tier: 'silver', threshold: 10, xpReward: 260 },
      { tier: 'gold', threshold: 25, xpReward: 520 },
    ],
  },
  {
    id: 'service_discovery',
    title: 'Service Discovery',
    description: 'Use service discovery to keep dynamic systems routable.',
    category: 'distributed_systems',
    icon: 'radar',
    metricKey: 'serviceDiscoveryApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 140 },
      { tier: 'silver', threshold: 10, xpReward: 280 },
      { tier: 'gold', threshold: 25, xpReward: 560 },
    ],
  },
  {
    id: 'leader_election',
    title: 'Leader Election',
    description: 'Model consensus and leader-election behavior correctly.',
    category: 'distributed_systems',
    icon: 'emoji_events',
    metricKey: 'leaderElectionApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 2, xpReward: 180 },
      { tier: 'silver', threshold: 8, xpReward: 360 },
      { tier: 'gold', threshold: 20, xpReward: 720 },
    ],
  },
  {
    id: 'sharding_mastery',
    title: 'Sharding',
    description: 'Apply sharding strategies correctly across distributed data stores.',
    category: 'distributed_systems',
    icon: 'grid_on',
    metricKey: 'shardingApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3,  xpReward: 150 },
      { tier: 'silver', threshold: 10, xpReward: 300 },
      { tier: 'gold',   threshold: 25, xpReward: 600 },
    ],
  },
  {
    id: 'replication_mastery',
    title: 'Replication',
    description: 'Use read replicas and data replication patterns correctly.',
    category: 'distributed_systems',
    icon: 'content_copy',
    metricKey: 'replicationApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 5,  xpReward: 100 },
      { tier: 'silver', threshold: 15, xpReward: 250 },
      { tier: 'gold',   threshold: 35, xpReward: 500 },
    ],
  },
  {
    id: 'circuit_breaker',
    title: 'Circuit Breaker',
    description: 'Implement circuit breaker patterns to prevent cascade failures.',
    category: 'distributed_systems',
    icon: 'electric_bolt',
    metricKey: 'circuitBreakerApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3,  xpReward: 150 },
      { tier: 'silver', threshold: 10, xpReward: 300 },
    ],
  },
  {
    id: 'rate_limiting',
    title: 'Rate Limiting',
    description: 'Apply rate limiting to protect services from overload.',
    category: 'distributed_systems',
    icon: 'speed',
    metricKey: 'rateLimitingApplications',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 100 },
      { tier: 'silver', threshold: 10, xpReward: 200 },
      { tier: 'gold',   threshold: 25, xpReward: 400 },
    ],
  },

  // ─── Reliability ─────────────────────────────────────────────────────────────
  {
    id: 'chaos_survivor',
    title: 'Chaos Survivor',
    description: 'Complete an interview with active chaos constraint changes.',
    category: 'reliability',
    icon: 'bolt',
    metricKey: 'chaosConstraintsAddressed',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3,  xpReward: 200 },
      { tier: 'silver', threshold: 10, xpReward: 400 },
      { tier: 'gold',   threshold: 25, xpReward: 800 },
    ],
  },
  {
    id: 'high_availability',
    title: 'High Availability',
    description: 'Design HA systems verified through simulation.',
    category: 'reliability',
    icon: 'verified',
    metricKey: 'highAvailabilityDesigns',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3,  xpReward: 200 },
      { tier: 'silver', threshold: 10, xpReward: 400 },
      { tier: 'gold',   threshold: 25, xpReward: 800 },
    ],
  },
  {
    id: 'disaster_recovery',
    title: 'Disaster Recovery',
    description: 'Design recovery workflows with explicit backup and restore paths.',
    category: 'reliability',
    icon: 'restore',
    metricKey: 'disasterRecoveryDesigns',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 220 },
      { tier: 'silver', threshold: 10, xpReward: 450 },
      { tier: 'gold', threshold: 25, xpReward: 900 },
    ],
  },
  {
    id: 'zero_downtime',
    title: 'Zero Downtime',
    description: 'Use safe rollout patterns without availability interruption.',
    category: 'reliability',
    icon: 'published_with_changes',
    metricKey: 'zeroDowntimeDeployments',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 180 },
      { tier: 'silver', threshold: 10, xpReward: 360 },
      { tier: 'gold', threshold: 25, xpReward: 720 },
    ],
  },
  {
    id: 'failover_expert',
    title: 'Failover Expert',
    description: 'Demonstrate automatic failover and reroute behavior under faults.',
    category: 'reliability',
    icon: 'swap_horiz',
    metricKey: 'failoverImplementations',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 200 },
      { tier: 'silver', threshold: 10, xpReward: 420 },
      { tier: 'gold', threshold: 25, xpReward: 850 },
    ],
  },
  {
    id: 'recovery_master',
    title: 'Recovery Master',
    description: 'Recover from severe chaos scenarios with strong final outcomes.',
    category: 'reliability',
    icon: 'health_metrics',
    metricKey: 'recoveryMasterRuns',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 1, xpReward: 280 },
      { tier: 'silver', threshold: 5, xpReward: 560 },
      { tier: 'gold', threshold: 15, xpReward: 1200 },
    ],
  },

  // ─── Scalability ──────────────────────────────────────────────────────────────
  {
    id: 'horizontal_hero',
    title: 'Horizontal Hero',
    description: 'Successfully scale systems horizontally in simulation.',
    category: 'scalability',
    icon: 'open_in_full',
    metricKey: 'simulationsExecuted',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 5,  xpReward: 100 },
      { tier: 'silver', threshold: 20, xpReward: 250 },
      { tier: 'gold',   threshold: 50, xpReward: 500 },
    ],
  },
  {
    id: 'million_user_ready',
    title: 'Million User Ready',
    description: 'Run a simulation with 1M+ target RPS successfully.',
    category: 'scalability',
    icon: 'groups',
    metricKey: 'millionRpsSimulations',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 1,  xpReward: 300 },
      { tier: 'silver', threshold: 5,  xpReward: 600 },
      { tier: 'gold',   threshold: 15, xpReward: 1200 },
    ],
  },
  {
    id: 'auto_scaling',
    title: 'Auto Scaling',
    description: 'Trigger autoscaling conditions and maintain service health.',
    category: 'scalability',
    icon: 'open_in_full',
    metricKey: 'autoScalingEvents',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 160 },
      { tier: 'silver', threshold: 12, xpReward: 340 },
      { tier: 'gold', threshold: 30, xpReward: 700 },
    ],
  },
  {
    id: 'high_throughput',
    title: 'High Throughput',
    description: 'Sustain high-throughput simulations without collapse.',
    category: 'scalability',
    icon: 'flash_on',
    metricKey: 'highThroughputSimulations',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 3, xpReward: 180 },
      { tier: 'silver', threshold: 12, xpReward: 380 },
      { tier: 'gold', threshold: 30, xpReward: 780 },
    ],
  },
  {
    id: 'global_infrastructure',
    title: 'Global Infrastructure',
    description: 'Design multi-region topologies that route globally.',
    category: 'scalability',
    icon: 'public',
    metricKey: 'globalInfrastructureDesigns',
    hidden: false,
    tiers: [
      { tier: 'bronze', threshold: 2, xpReward: 200 },
      { tier: 'silver', threshold: 8, xpReward: 420 },
      { tier: 'gold', threshold: 20, xpReward: 850 },
    ],
  },

  // ─── Reference Architectures ──────────────────────────────────────────────────
  {
    id: 'reference_arch_explorer',
    title: 'Reference Architect',
    description: 'Complete reference architecture challenges.',
    category: 'reference_architectures',
    icon: 'map',
    metricKey: 'referenceArchitecturesCompleted',
    hidden: false,
    tiers: [
      { tier: 'bronze',   threshold: 1,  xpReward: 150 },
      { tier: 'silver',   threshold: 3,  xpReward: 300 },
      { tier: 'gold',     threshold: 7,  xpReward: 600 },
      { tier: 'platinum', threshold: 14, xpReward: 1200 },
    ],
  },

  // ─── Secret Achievements ──────────────────────────────────────────────────────
  {
    id: 'kraken',
    title: 'Kraken',
    description: 'Design a system with 50+ components.',
    category: 'secret',
    icon: 'bug_report',
    metricKey: 'maxNodesInSingleDesign',
    hidden: true,
    tiers: [{ tier: 'gold', threshold: 50, xpReward: 500 }],
  },
  {
    id: 'blackout',
    title: 'Blackout',
    description: 'Recover from severe chaos while preserving a strong outcome.',
    category: 'secret',
    icon: 'dark_mode',
    metricKey: 'blackoutRecovered',
    hidden: true,
    tiers: [{ tier: 'platinum', threshold: 1, xpReward: 1600 }],
  },
  {
    id: 'distributed_mind',
    title: 'Distributed Mind',
    description: 'Unlock achievements in 5 different categories.',
    category: 'secret',
    icon: 'account_tree',
    metricKey: 'achievementCategoriesUnlocked',
    hidden: true,
    tiers: [
      { tier: 'silver',   threshold: 3, xpReward: 300 },
      { tier: 'gold',     threshold: 5, xpReward: 600 },
      { tier: 'platinum', threshold: 7, xpReward: 1200 },
    ],
  },
  {
    id: 'planet_scale',
    title: 'Planet Scale',
    description: 'Complete all scalability achievements.',
    category: 'secret',
    icon: 'public',
    metricKey: 'scalabilityAchievementsCompleted',
    hidden: true,
    tiers: [{ tier: 'diamond', threshold: 1, xpReward: 2000 }],
  },
  {
    id: 'system_whisperer',
    title: 'System Whisperer',
    description: 'Score 90+ on 5 different interview difficulties.',
    category: 'secret',
    icon: 'tips_and_updates',
    metricKey: 'highScoreAcrossDifficulties',
    hidden: true,
    tiers: [{ tier: 'platinum', threshold: 5, xpReward: 1500 }],
  },
];

/** Fast lookup map by id */
export const ACHIEVEMENT_MAP = new Map<string, AchievementDef>(
  ACHIEVEMENT_DEFINITIONS.map((a) => [a.id, a])
);
