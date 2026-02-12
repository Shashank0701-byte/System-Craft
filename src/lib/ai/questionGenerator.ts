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
 * Generate a system design interview question using Gemini.
 *
 * @param difficulty - The difficulty level for the question
 * @returns A structured interview question
 */
export async function generateInterviewQuestion(
    difficulty: InterviewDifficulty
): Promise<IInterviewQuestion> {
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

    // Validate and sanitize the response
    const question: IInterviewQuestion = {
        prompt: generated.prompt || `Design a system (${difficulty} difficulty)`,
        requirements: Array.isArray(generated.requirements) ? generated.requirements.slice(0, 6) : [],
        constraints: Array.isArray(generated.constraints) ? generated.constraints.slice(0, 5) : [],
        trafficProfile: {
            users: generated.trafficProfile?.users || undefined,
            rps: generated.trafficProfile?.rps || undefined,
            storage: generated.trafficProfile?.storage || undefined,
        },
        hints: Array.isArray(generated.hints) ? generated.hints.slice(0, 4) : [],
    };

    // Basic validation — must have at least a prompt and some requirements
    if (!question.prompt || question.requirements.length === 0) {
        throw new Error('AI generated an invalid question structure. Please try again.');
    }

    return question;
}
