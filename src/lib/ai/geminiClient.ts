import OpenAI from 'openai';

let client: OpenAI | null = null;

/**
 * Get or initialize the OpenRouter client.
 * Uses the OpenAI SDK with OpenRouter's base URL.
 */
function getClient(): OpenAI {
    if (client) return client;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    client = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
            'HTTP-Referer': 'https://systemcraft.app',
            'X-Title': 'SystemCraft',
        },
    });

    return client;
}

/**
 * Generate structured JSON content via OpenRouter.
 * Uses goolge/gemini-2.0-flash-lite-preview-02-05:free for zero-cost generation.
 * Falls back gracefully with retry logic for transient errors.
 */
export async function generateJSON<T>(prompt: string, retries = 2): Promise<T> {
    const openrouter = getClient();

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await openrouter.chat.completions.create({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    {
                        role: 'user',
                        content: `${prompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown formatting, no explanations.`,
                    },
                ],
                temperature: 0.8,
                max_tokens: 2048,
            });

            const text = response.choices[0]?.message?.content?.trim();
            if (!text) {
                throw new Error('Empty response from OpenRouter');
            }

            // Clean up — strip markdown fences if present
            const cleaned = text
                .replace(/^```json\s*/i, '')
                .replace(/```\s*$/, '')
                .trim();

            return JSON.parse(cleaned) as T;
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            const status = (error as { status?: number })?.status;

            // Don't retry non-transient errors
            if (status === 401 || errMsg.includes('Invalid API key')) {
                console.error('OpenRouter auth error:', errMsg);
                throw new Error('AI API key is invalid. Please update OPENROUTER_API_KEY.');
            }
            if (status === 402) {
                console.error('OpenRouter billing error:', errMsg);
                throw new Error('AI billing issue. Please check your OpenRouter credits.');
            }

            if (attempt === retries) {
                console.error(`OpenRouter generation failed after ${retries + 1} attempts:`, error);
                throw new Error('Failed to generate AI content. Please try again.');
            }
            // Brief backoff before retry (only for transient errors)
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
    }

    throw new Error('Unreachable');
}
