import { generateJSON } from './geminiClient';
import { IInterviewQuestion, InterviewDifficulty } from '../db/models/InterviewSession';

/**
 * Difficulty-specific configuration for question generation.
 */
const DIFFICULTY_CONFIG: Record<InterviewDifficulty, {
    scaleRange: string;
    complexityGuidance: string;
    exampleTopics: string[];
    timeMinutes: number;
}> = {
    easy: {
        scaleRange: '100K–1M users, ~1K requests/sec',
        complexityGuidance: 'Focus on basic CRUD, simple client-server architecture, single database. Suitable for junior-level candidates.',
        exampleTopics: [
            'URL shortener', 'Pastebin clone', 'Rate limiter', 'Key-value store',
            'Task queue', 'Centralized logging system', 'File storage service', 'Polling/voting system',
            'API gateway with auth', 'Webhook delivery service', 'Feature flag system',
            'Leaderboard service', 'Session management store', 'Email verification system',
            'Image thumbnail generator', 'RSS feed aggregator', 'Markdown note-taking app',
            'Health check monitor', 'Short-lived secret sharing (like PrivateBin)',
            'Simple DNS resolver', 'Config management service', 'CAPTCHA verification service',
            'Invite-code system', 'Link preview generator', 'Tag/bookmark manager',
            'Audit log service', 'Static site deployment pipeline', 'Simple search engine for blog',
            'API usage metering dashboard', 'OTP/2FA service',
        ],
        timeMinutes: 30,
    },
    medium: {
        scaleRange: '1M–50M users, 1K–50K requests/sec',
        complexityGuidance: 'Requires caching, load balancing, database replication, CDN. Needs trade-off discussions. Suitable for mid-level candidates.',
        exampleTopics: [
            'Twitter/X feed', 'Instagram photo sharing', 'Real-time chat application',
            'Notification system', 'Search autocomplete', 'E-commerce product platform',
            'Ride-sharing matching service', 'News feed aggregator', 'Online multiplayer game lobby',
            'Video conferencing signaling server', 'Collaborative playlist (like Spotify)',
            'Food delivery order system', 'IoT device telemetry pipeline',
            'Real-time sports scoreboard', 'Ticket booking system (concerts/flights)',
            'Social media stories feature', 'Geofencing alert system',
            'Content moderation pipeline', 'Customer support ticketing system',
            'Real-time auction platform', 'Fitness tracker data aggregator',
            'Markdown-based wiki with versioning', 'Event sourcing-based shopping cart',
            'Multi-tenant SaaS billing system', 'Podcast hosting and streaming platform',
            'Parking spot finder with live availability', 'Package delivery tracking system',
            'Permission and RBAC management system', 'A/B testing framework',
            'Collaborative kanban board', 'Real-time currency exchange dashboard',
        ],
        timeMinutes: 45,
    },
    hard: {
        scaleRange: '50M–500M+ users, 50K–500K+ requests/sec',
        complexityGuidance: 'Requires multi-region deployment, CQRS, event sourcing, message queues, sharding, consensus protocols. Deep architectural reasoning required. Suitable for senior-level candidates.',
        exampleTopics: [
            'YouTube video streaming', 'Google Maps navigation', 'Uber/Lyft real-time dispatch',
            'Distributed file system (like GFS/HDFS)', 'Real-time collaborative document editor',
            'Stock trading platform', 'Social media platform at global scale',
            'Content delivery network from scratch', 'Distributed search engine (like Elasticsearch)',
            'Real-time fraud detection system', 'Multi-region chat system (like WhatsApp)',
            'ML model serving platform', 'Distributed workflow engine (like Airflow at scale)',
            'Live video streaming with chat (like Twitch)', 'Genomics data processing pipeline',
            'Autonomous vehicle telemetry system', 'Global payment processing system (like Stripe)',
            'Ad serving platform with real-time bidding', 'Distributed rate limiter at CDN edge',
            'Real-time recommendation engine', 'Healthcare FHIR-compliant data exchange',
            'Multi-player real-time game server (like Fortnite)', 'Supply chain tracking system',
            'Observability platform (logs, metrics, traces)', 'Distributed cron/scheduler',
            'Event-driven microservices orchestrator', 'Blockchain-based asset registry',
            'Global DNS system with failover', 'Code deployment pipeline (CI/CD at scale)',
            'Disaster recovery orchestration platform', 'IoT fleet management for 10M+ devices',
        ],
        timeMinutes: 60,
    },
};

/**
 * Pick N random items from an array without replacement.
 */
function pickRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Build the system prompt for question generation.
 * Uses a random subset of example topics and a session seed to maximize diversity.
 */
function buildQuestionPrompt(difficulty: InterviewDifficulty): string {
    const config = DIFFICULTY_CONFIG[difficulty];

    // Pick a random subset of 6 topics — prevents the AI from clustering around the same ones
    const selectedTopics = pickRandom(config.exampleTopics, 6);
    // Random seed so repeated calls with the same prompt still vary
    const seed = Math.random().toString(36).substring(2, 8);

    return `You are a senior system design interviewer at a top tech company.

Generate a unique, realistic system design interview question at the "${difficulty}" difficulty level.

DIFFICULTY GUIDELINES:
- Scale: ${config.scaleRange}
- ${config.complexityGuidance}
- Inspiration topics (pick ONE as a starting point, then create a unique, creative variant — DO NOT copy directly): ${selectedTopics.join(', ')}

RULES:
1. The question must be a SPECIFIC system (e.g., "Design a real-time collaborative whiteboard" not "Design a system")
2. Include 3-5 functional requirements that are CLEAR and TESTABLE
3. Include 2-4 scale constraints with SPECIFIC numbers
4. Traffic profile must use realistic numbers matching the difficulty
5. Provide 2-3 hints that guide toward good architecture WITHOUT giving the answer
6. DO NOT use generic questions — make it specific and interesting
7. Requirements should be achievable within ${config.timeMinutes} minutes of design time
8. Be CREATIVE. Avoid overly common questions like "URL shortener" or "Twitter clone" — think of real-world systems people actually use
9. The question should naturally require a mix of compute, storage, networking, and messaging components

Session seed: ${seed}

Return ONLY this JSON structure:
{
  "prompt": "Design a [specific system description]",
  "requirements": [
    "Functional requirement 1 (specific and testable)",
    "Functional requirement 2",
    "Functional requirement 3"
  ],
  "constraints": [
    "Scale constraint with specific number",
    "Performance constraint with specific SLA"
  ],
  "trafficProfile": {
    "users": "X DAU/MAU",
    "rps": "X requests/sec at peak",
    "storage": "X TB/PB estimated"
  },
  "hints": [
    "Architectural hint 1",
    "Architectural hint 2"
  ]
}`;
}

/**
 * Curated fallback questions for when AI generation is unavailable.
 * 8 per difficulty, randomly selected.
 */
const FALLBACK_QUESTIONS: Record<InterviewDifficulty, IInterviewQuestion[]> = {
    easy: [
        {
            prompt: 'Design a URL shortening service like Bitly',
            requirements: [
                'Users can submit a long URL and receive a shortened version',
                'Shortened URLs redirect to the original URL when visited',
                'Users can view click analytics for their shortened URLs',
                'URLs expire after a configurable TTL',
            ],
            constraints: [
                'Support up to 500K URLs created per day',
                'Redirect latency must be under 50ms at p99',
            ],
            trafficProfile: { users: '500K DAU', rps: '1K requests/sec', storage: '5 TB over 5 years' },
            hints: [
                'Consider how you would generate unique short codes efficiently',
                'Think about caching for popular URLs',
            ],
        },
        {
            prompt: 'Design a simple task queue system for background job processing',
            requirements: [
                'Producers can enqueue tasks with a payload and priority',
                'Workers consume tasks in priority order',
                'Failed tasks are retried up to 3 times with exponential backoff',
                'Dashboard shows queue depth and processing rates',
            ],
            constraints: [
                'Handle up to 10K tasks per minute',
                'Task processing latency within 5 seconds of enqueue for high priority',
            ],
            trafficProfile: { users: '200K DAU', rps: '500 requests/sec', storage: '500 GB' },
            hints: [
                'Consider using a message broker vs a database-backed queue',
                'Think about how to handle poison messages',
            ],
        },
        {
            prompt: 'Design a rate limiter service for an API gateway',
            requirements: [
                'Limit requests per user/IP based on configurable rules',
                'Support sliding window and token bucket algorithms',
                'Return appropriate HTTP 429 responses with retry-after headers',
                'Provide a dashboard for monitoring rate limit hits',
            ],
            constraints: [
                'Decision latency under 5ms per request',
                'Support 100K unique clients',
            ],
            trafficProfile: { users: '100K clients', rps: '2K requests/sec', storage: '10 GB' },
            hints: [
                'Consider distributed counting with Redis',
                'Think about accuracy vs performance trade-offs in window algorithms',
            ],
        },
        {
            prompt: 'Design a webhook delivery service for a developer platform',
            requirements: [
                'Customers register HTTPS endpoints to receive event payloads',
                'Events are delivered with at-least-once guarantee',
                'Failed deliveries are retried with exponential backoff up to 72 hours',
                'Provide a delivery log with status, latency, and response body',
            ],
            constraints: [
                'Handle 50K webhook deliveries per minute',
                'Initial delivery within 5 seconds of event creation',
            ],
            trafficProfile: { users: '100K registered endpoints', rps: '800 requests/sec', storage: '200 GB logs' },
            hints: [
                'Think about idempotency keys for consumers to deduplicate',
                'Consider a dead-letter queue for persistently failing endpoints',
            ],
        },
        {
            prompt: 'Design a feature flag management system',
            requirements: [
                'Engineers can create, toggles, and archive feature flags via a dashboard',
                'Flags support percentage rollouts, user segment targeting, and kill switches',
                'SDKs in the client apps evaluate flags locally with <10ms latency',
                'Audit log tracks who changed which flag and when',
            ],
            constraints: [
                'Flag evaluation under 10ms at p99 (client-side)',
                'Support 200K flag evaluations per second across all SDKs',
            ],
            trafficProfile: { users: '500 engineers, 1M end-users', rps: '200K flag evals/sec', storage: '5 GB' },
            hints: [
                'Think about pushing flag updates via SSE or WebSocket vs polling',
                'Consider how to handle flag evaluation when the server is unreachable',
            ],
        },
        {
            prompt: 'Design an image thumbnail generation service',
            requirements: [
                'Users upload images which are resized into 3 standard thumbnail sizes',
                'Thumbnails are generated asynchronously after upload',
                'Original and thumbnails are served via CDN with cache headers',
                'Support JPEG, PNG, and WebP output formats',
            ],
            constraints: [
                'Process up to 5K images per minute',
                'Thumbnail generation within 10 seconds of upload',
            ],
            trafficProfile: { users: '300K DAU', rps: '500 reads/sec', storage: '10 TB' },
            hints: [
                'Consider a worker pool consuming from a queue for async processing',
                'Think about how to handle image uploads larger than expected (abuse prevention)',
            ],
        },
        {
            prompt: 'Design a real-time leaderboard system for an online game',
            requirements: [
                'Track player scores and rank them globally in real-time',
                'Support daily, weekly, and all-time leaderboards',
                'Players can query their rank and the top-N players',
                'Scores update reflect within 1 second',
            ],
            constraints: [
                'Handle 100K score updates per minute',
                'Rank lookup under 20ms at p95',
            ],
            trafficProfile: { users: '1M gamers', rps: '2K requests/sec', storage: '50 GB' },
            hints: [
                'Consider Redis sorted sets for O(logN) rank operations',
                'Think about how to reset periodic leaderboards efficiently',
            ],
        },
        {
            prompt: 'Design an OTP/two-factor authentication service',
            requirements: [
                'Generate time-based OTPs (TOTP) and SMS-based OTPs',
                'Validate OTP within a configurable window (default 30 seconds)',
                'Rate limit OTP verification attempts to prevent brute force',
                'Support backup codes for account recovery',
            ],
            constraints: [
                'Verification latency under 50ms',
                'Support 500K active users with MFA enabled',
            ],
            trafficProfile: { users: '500K MFA users', rps: '1K verifications/sec', storage: '2 GB' },
            hints: [
                'Consider HMAC-based one-time password algorithm (RFC 6238)',
                'Think about secure secret storage and how to prevent replay attacks',
            ],
        },
    ],
    medium: [
        {
            prompt: 'Design a real-time notification system for a social media platform',
            requirements: [
                'Push notifications for likes, comments, follows, and mentions',
                'Support web push, mobile push, email, and in-app notifications',
                'Users can configure notification preferences per channel',
                'Notifications are delivered within 2 seconds of the triggering event',
                'Support notification grouping and digest mode',
            ],
            constraints: [
                'Handle 10M+ active users with 50K notifications/sec at peak',
                'Support at-least-once delivery guarantee',
                '99.9% uptime SLA',
            ],
            trafficProfile: { users: '10M DAU', rps: '50K notifications/sec peak', storage: '20 TB' },
            hints: [
                'Consider pub/sub architecture for fan-out',
                'Think about how to handle notification storms from viral content',
                'WebSocket vs SSE for real-time web delivery',
            ],
        },
        {
            prompt: 'Design an e-commerce search autocomplete system',
            requirements: [
                'Show search suggestions as users type, updating within 100ms',
                'Rank suggestions by relevance, popularity, and personalization',
                'Support typo correction and fuzzy matching',
                'Handle trending and seasonal search terms',
            ],
            constraints: [
                'Serve 20K autocomplete requests/sec at peak',
                'Latency under 100ms at p95',
                'Index 50M+ product catalog',
            ],
            trafficProfile: { users: '5M DAU', rps: '20K requests/sec', storage: '2 TB index' },
            hints: [
                'Consider trie data structures vs inverted indexes',
                'Think about how to blend real-time trending with pre-computed suggestions',
            ],
        },
        {
            prompt: 'Design a ride-sharing matching system like Uber',
            requirements: [
                'Match riders with nearby available drivers in real-time',
                'Calculate ETA and optimal route for rider pickup',
                'Handle surge pricing based on supply/demand ratio',
                'Support ride cancellation and driver reassignment',
                'Track driver location updates every 3 seconds',
            ],
            constraints: [
                'Match a rider to a driver within 10 seconds',
                'Handle 1M concurrent drivers reporting location',
                'Geospatial queries within 5km radius under 50ms',
            ],
            trafficProfile: { users: '15M MAU', rps: '30K requests/sec', storage: '10 TB' },
            hints: [
                'Consider geospatial indexing (geohash, quad-trees)',
                'Think about how to handle high-density urban areas vs rural',
            ],
        },
        {
            prompt: 'Design a food delivery order management system like DoorDash',
            requirements: [
                'Customers browse restaurant menus and place orders',
                'Orders are dispatched to the nearest available driver',
                'Real-time order tracking from restaurant to doorstep',
                'Support promo codes and loyalty points',
                'Estimated delivery time shown before checkout',
            ],
            constraints: [
                'Handle 500K concurrent orders during dinner peak',
                'Order dispatch latency under 30 seconds',
                '99.9% order accuracy (no lost or duplicated orders)',
            ],
            trafficProfile: { users: '8M MAU', rps: '15K requests/sec peak', storage: '5 TB' },
            hints: [
                'Think about a state machine for order lifecycle (placed → accepted → picked up → delivered)',
                'Consider how to handle restaurant capacity and order throttling',
            ],
        },
        {
            prompt: 'Design an IoT sensor telemetry ingestion pipeline',
            requirements: [
                'Ingest telemetry data from 500K IoT devices reporting every 10 seconds',
                'Store time-series data for 90-day hot storage, 2-year cold archive',
                'Real-time anomaly detection with alerting within 30 seconds',
                'Dashboard with per-device and fleet-wide metrics',
            ],
            constraints: [
                'Ingest 50K data points per second sustained',
                'Query latency for last-24h data under 200ms',
                'Zero data loss — every reading must be persisted',
            ],
            trafficProfile: { users: '500K devices', rps: '50K writes/sec', storage: '50 TB/year' },
            hints: [
                'Consider a time-series database for efficient storage and queries',
                'Think about partitioning by device ID and time range',
            ],
        },
        {
            prompt: 'Design an online multiplayer game lobby and matchmaking system',
            requirements: [
                'Players create or join game lobbies with configurable settings',
                'Skill-based matchmaking pairs players of similar rank',
                'Support 2v2, 5v5, and battle-royale (100-player) modes',
                'Real-time lobby chat and ready-check before game start',
                'Handle player disconnects and reconnection within 60 seconds',
            ],
            constraints: [
                'Find a match within 30 seconds for 95% of players',
                'Support 200K concurrent players in matchmaking queues',
                'WebSocket connections must support 100K concurrent sessions',
            ],
            trafficProfile: { users: '2M DAU', rps: '10K requests/sec', storage: '1 TB' },
            hints: [
                'Consider Elo/Glicko rating systems for skill ranking',
                'Think about regional sharding to minimize latency',
            ],
        },
        {
            prompt: 'Design a real-time ticket booking system for live events',
            requirements: [
                'Users browse events and select specific seats from a venue map',
                'Seats are held for 10 minutes during checkout to prevent double-booking',
                'Support waitlists when an event sells out',
                'Generate and validate unique QR-code tickets',
                'Handle flash sales where 50K users try to book simultaneously',
            ],
            constraints: [
                'Zero double-bookings — strong consistency on seat inventory',
                'Checkout flow completes within 3 seconds under load',
                'Handle 50K concurrent users during on-sale events',
            ],
            trafficProfile: { users: '5M MAU', rps: '20K requests/sec peak', storage: '500 GB' },
            hints: [
                'Consider optimistic vs pessimistic locking for seat reservation',
                'Think about a virtual waiting room to smooth traffic spikes',
            ],
        },
        {
            prompt: 'Design an A/B testing and experimentation platform',
            requirements: [
                'Data scientists create experiments with multiple variants and traffic splits',
                'SDK assigns users to variants deterministically (consistent hashing)',
                'Compute statistical significance in near-real-time',
                'Support guardrail metrics that auto-stop harmful experiments',
                'Dashboard shows conversion rates, confidence intervals, and impact',
            ],
            constraints: [
                'Variant assignment latency under 5ms (client-side SDK)',
                'Handle 10M events per day for metric computation',
                'Support 500 concurrent experiments',
            ],
            trafficProfile: { users: '10M DAU', rps: '5K events/sec', storage: '10 TB/year' },
            hints: [
                'Consider consistent hashing for sticky variant assignment',
                'Think about how to handle interaction effects between overlapping experiments',
            ],
        },
    ],
    hard: [
        {
            prompt: 'Design a global-scale real-time collaborative document editor like Google Docs',
            requirements: [
                'Multiple users can edit the same document simultaneously',
                'Changes appear within 200ms for all collaborators',
                'Support rich text formatting, images, and embedded content',
                'Full version history with the ability to revert to any point',
                'Offline editing with automatic conflict resolution on reconnect',
            ],
            constraints: [
                'Support 500M+ total users, 50M DAU',
                'Handle documents with 100+ simultaneous editors',
                'Zero data loss guarantee — all edits must be persisted',
                '99.99% availability across 5+ global regions',
            ],
            trafficProfile: { users: '50M DAU', rps: '200K operations/sec', storage: '500 PB' },
            hints: [
                'Research OT (Operational Transform) vs CRDT approaches',
                'Consider how to shard documents and handle hot partitions',
                'Think about the trade-offs of eventual consistency in editing',
            ],
        },
        {
            prompt: 'Design a distributed video processing and streaming pipeline like YouTube',
            requirements: [
                'Users upload videos which are transcoded into multiple resolutions',
                'Adaptive bitrate streaming based on viewer bandwidth',
                'Real-time view counting and trending algorithm',
                'Content recommendation engine based on watch history',
                'Live streaming support with under 5-second latency',
            ],
            constraints: [
                'Process 500 hours of video uploaded per minute',
                'Serve 1M concurrent video streams',
                'Global CDN with content available in all regions within 30 minutes of upload',
                '99.99% video playback availability',
            ],
            trafficProfile: { users: '200M DAU', rps: '500K requests/sec', storage: '1 EB (exabyte)' },
            hints: [
                'Consider DAG-based transcoding pipelines',
                'Think about CDN architecture and cache invalidation',
                'How would you handle copyright detection at scale?',
            ],
        },
        {
            prompt: 'Design a high-frequency stock trading platform with real-time market data',
            requirements: [
                'Process market orders with sub-millisecond matching engine latency',
                'Stream real-time price feeds to 100K+ concurrent traders',
                'Support limit orders, stop-loss, and margin trading',
                'Complete audit trail for regulatory compliance',
                'Risk management system that halts trading on anomalies',
            ],
            constraints: [
                'Order matching latency under 1ms at p99',
                'Handle 1M orders/sec during market peaks',
                'Zero tolerance for data inconsistency (financial accuracy)',
                'Multi-datacenter failover with RPO of 0',
            ],
            trafficProfile: { users: '500K active traders', rps: '1M orders/sec peak', storage: '100 TB/year' },
            hints: [
                'Consider event sourcing for the order book',
                'Think about LMAX Disruptor pattern for low-latency processing',
                'How would you handle network partitions without losing trades?',
            ],
        },
        {
            prompt: 'Design a real-time fraud detection system for a global payment processor',
            requirements: [
                'Evaluate every transaction in real-time against ML fraud models',
                'Support rule-based and model-based detection in a pipeline',
                'Flag suspicious transactions for manual review with confidence scores',
                'Feedback loop: analyst decisions retrain models nightly',
                'Audit trail and compliance reporting for regulators',
            ],
            constraints: [
                'Decision latency under 100ms per transaction',
                'Process 50K transactions per second at peak',
                'False positive rate below 0.1% to avoid blocking legitimate users',
                '99.999% availability — downtime blocks all payments',
            ],
            trafficProfile: { users: '100M cardholders', rps: '50K transactions/sec', storage: '200 TB/year' },
            hints: [
                'Consider feature stores for real-time ML feature serving',
                'Think about how to handle model versioning and shadow scoring',
                'How would you design the system to handle cold-start fraud patterns?',
            ],
        },
        {
            prompt: 'Design an ML model serving platform for production inference at scale',
            requirements: [
                'Data scientists deploy trained models via API with zero-downtime rollouts',
                'Support A/B testing between model versions with traffic splitting',
                'Auto-scale GPU/CPU inference workers based on request load',
                'Monitor model drift, latency, and prediction quality in real-time',
                'Support batch inference for nightly reprocessing',
            ],
            constraints: [
                'Inference latency under 50ms at p99 for real-time models',
                'Handle 100K inference requests per second',
                'Support models ranging from 100MB to 10GB in size',
                '99.95% availability SLA',
            ],
            trafficProfile: { users: '500 ML engineers, 50M end-users', rps: '100K inferences/sec', storage: '50 TB models' },
            hints: [
                'Consider model registry, container-based serving, and Kubernetes autoscaling',
                'Think about model warm-up to avoid cold-start latency spikes',
            ],
        },
        {
            prompt: 'Design a real-time ad serving platform with bidding (like Google Ads)',
            requirements: [
                'Serve targeted ads to users based on context, profile, and intent',
                'Run real-time bidding (RTB) auctions completing within 100ms',
                'Support budget pacing to spread advertiser spend across the day',
                'Track impressions and clicks for billing with exactly-once counting',
                'Fraud detection for click farms and bot traffic',
            ],
            constraints: [
                'Serve 1M ad requests per second globally',
                'RTB auction latency under 100ms end-to-end',
                'Click tracking accuracy 99.99% — billing depends on it',
                'Multi-region with consistent auction results',
            ],
            trafficProfile: { users: '500M DAU', rps: '1M requests/sec', storage: '500 TB/year' },
            hints: [
                'Consider how to build a fast user feature lookup for ad targeting',
                'Think about second-price vs first-price auction mechanics',
                'How would you handle sudden budget exhaustion mid-day?',
            ],
        },
        {
            prompt: 'Design a full-stack observability platform (logs, metrics, traces)',
            requirements: [
                'Ingest structured logs, time-series metrics, and distributed traces',
                'Unified query engine to correlate logs ↔ metrics ↔ traces',
                'Real-time alerting with configurable thresholds and anomaly detection',
                'Dashboards with custom charts and shared views',
                'Support 90-day hot retention, 1-year cold archive',
            ],
            constraints: [
                'Ingest 5M events per second across all signal types',
                'Query latency under 2 seconds for last-24h data',
                'Zero data loss during ingestion spikes',
                '99.9% platform availability',
            ],
            trafficProfile: { users: '10K engineering orgs', rps: '5M events/sec', storage: '2 PB/year' },
            hints: [
                'Consider column-oriented storage for efficient metric queries',
                'Think about how to implement trace-to-log correlation at ingest time',
                'How would you handle a 10x traffic spike during an incident?',
            ],
        },
        {
            prompt: 'Design a global payment processing system like Stripe',
            requirements: [
                'Process credit card, bank transfer, and wallet payments worldwide',
                'Support multi-currency with real-time exchange rate conversion',
                'Idempotent API to prevent duplicate charges',
                'Webhook-based event notifications for payment lifecycle',
                'PCI-DSS compliant data handling with tokenized card storage',
            ],
            constraints: [
                'Payment authorization latency under 500ms at p99',
                'Handle 100K transactions per second globally',
                'Zero tolerance for double-charging or lost payments',
                '99.999% availability — downtime directly causes revenue loss',
            ],
            trafficProfile: { users: '1M merchants', rps: '100K transactions/sec', storage: '500 TB/year' },
            hints: [
                'Consider saga pattern for multi-step payment workflows',
                'Think about how to handle partial failures (auth succeeds, capture fails)',
                'How would you design the vault for PCI-compliant card storage?',
            ],
        },
    ],
};

/**
 * Pick a random fallback question for the given difficulty.
 */
function getRandomFallback(difficulty: InterviewDifficulty): IInterviewQuestion {
    const pool = FALLBACK_QUESTIONS[difficulty];
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generate a system design interview question using AI.
 * Falls back to a curated question pool if AI is unavailable.
 *
 * @param difficulty - The difficulty level for the question
 * @returns A structured interview question
 */
export async function generateInterviewQuestion(
    difficulty: InterviewDifficulty
): Promise<IInterviewQuestion> {
    // Try AI generation first
    try {
        const prompt = buildQuestionPrompt(difficulty);

        const generated = await generateJSON<{
            prompt: string;
            requirements: string[];
            constraints: string[];
            trafficProfile: {
                users?: string;
                rps?: string;
                storage?: string;
            };
            hints: string[];
        }>(prompt);

        // Validate before applying fallbacks — reject truly empty AI responses
        if (!generated.prompt || !Array.isArray(generated.requirements) || generated.requirements.length === 0) {
            throw new Error('AI generated an invalid question structure');
        }

        // Sanitize the response
        const question: IInterviewQuestion = {
            prompt: generated.prompt,
            requirements: generated.requirements.slice(0, 6),
            constraints: Array.isArray(generated.constraints) ? generated.constraints.slice(0, 5) : [],
            trafficProfile: {
                users: generated.trafficProfile?.users || undefined,
                rps: generated.trafficProfile?.rps || undefined,
                storage: generated.trafficProfile?.storage || undefined,
            },
            hints: Array.isArray(generated.hints) ? generated.hints.slice(0, 4) : [],
        };

        return question;
    } catch (error) {
        console.warn(
            `AI question generation failed, using fallback pool:`,
            error instanceof Error ? error.message : error
        );
        return getRandomFallback(difficulty);
    }
}

