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
            'URL shortener', 'Pastebin', 'Rate limiter', 'Key-value store',
            'Task queue', 'Logging system', 'File storage service', 'Polling system',
        ],
        timeMinutes: 30,
    },
    medium: {
        scaleRange: '1M–50M users, 1K–50K requests/sec',
        complexityGuidance: 'Requires caching, load balancing, database replication, CDN. Needs trade-off discussions. Suitable for mid-level candidates.',
        exampleTopics: [
            'Twitter/X feed', 'Instagram photo sharing', 'Chat application',
            'Notification system', 'Search autocomplete', 'E-commerce platform',
            'Ride-sharing service', 'News feed aggregator',
        ],
        timeMinutes: 45,
    },
    hard: {
        scaleRange: '50M–500M+ users, 50K–500K+ requests/sec',
        complexityGuidance: 'Requires multi-region deployment, CQRS, event sourcing, message queues, sharding, consensus protocols. Deep architectural reasoning required. Suitable for senior-level candidates.',
        exampleTopics: [
            'YouTube video streaming', 'Google Maps', 'Uber/Lyft real-time dispatch',
            'Distributed file system', 'Real-time collaborative editor',
            'Stock trading platform', 'Social media platform at global scale',
            'Content delivery network',
        ],
        timeMinutes: 60,
    },
};

/**
 * Build the system prompt for question generation.
 */
function buildQuestionPrompt(difficulty: InterviewDifficulty): string {
    const config = DIFFICULTY_CONFIG[difficulty];

    return `You are a senior system design interviewer at a top tech company.

Generate a unique, realistic system design interview question at the "${difficulty}" difficulty level.

DIFFICULTY GUIDELINES:
- Scale: ${config.scaleRange}
- ${config.complexityGuidance}
- Example topics (for inspiration, DO NOT copy directly — create a unique variant): ${config.exampleTopics.join(', ')}

RULES:
1. The question must be a SPECIFIC system (e.g., "Design a real-time collaborative whiteboard" not "Design a system")
2. Include 3-5 functional requirements that are CLEAR and TESTABLE
3. Include 2-4 scale constraints with SPECIFIC numbers
4. Traffic profile must use realistic numbers matching the difficulty
5. Provide 2-3 hints that guide toward good architecture WITHOUT giving the answer
6. DO NOT use generic questions — make it specific and interesting
7. Requirements should be achievable within ${config.timeMinutes} minutes of design time

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
 * 3 per difficulty, randomly selected.
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

