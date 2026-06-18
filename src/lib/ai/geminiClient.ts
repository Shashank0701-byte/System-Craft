import OpenAI from 'openai';
import { llmRequestsTotal, llmRequestDuration, llmTokensTotal } from '@/src/lib/metrics';

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
 * Uses Google Gemini 2.0 Flash via OpenRouter for high-quality generation.
 * Falls back gracefully with retry logic for transient errors.
 */
export async function generateJSON<T>(prompt: string, retries = 2, timeoutMs = 60000): Promise<T> {
    const openrouter = getClient();

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // AbortController with timeout to prevent hanging forever on slow AI responses
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            const llmTimer = llmRequestDuration.startTimer({ model: 'google/gemini-2.0-flash-001' });

            let response;
            try {
                response = await openrouter.chat.completions.create(
                    {
                        model: 'google/gemini-2.0-flash-001',
                        messages: [
                            {
                                role: 'user',
                                content: `${prompt}\n\nIMPORTANT: You must return ONLY valid JSON. Do not include markdown formatting (like \`\`\`json), do not include any conversational text before or after the JSON. Your entire response must be parseable by JSON.parse().`,
                            },
                        ],
                        temperature: 0.8,
                        max_tokens: 2048,
                    },
                    { signal: controller.signal }
                );
                llmTimer();
                llmRequestsTotal.inc({ model: 'google/gemini-2.0-flash-001', status: 'success' });
                
                // Track tokens if provided by OpenRouter
                if (response.usage) {
                    if (response.usage.prompt_tokens) llmTokensTotal.inc({ model: 'google/gemini-2.0-flash-001', type: 'prompt' }, response.usage.prompt_tokens);
                    if (response.usage.completion_tokens) llmTokensTotal.inc({ model: 'google/gemini-2.0-flash-001', type: 'completion' }, response.usage.completion_tokens);
                }
            } catch(e) {
                llmTimer();
                llmRequestsTotal.inc({ model: 'google/gemini-2.0-flash-001', status: 'error' });
                throw e;
            } finally {
                clearTimeout(timer);
            }

            const text = response.choices[0]?.message?.content?.trim();
            if (!text) {
                throw new Error('Empty response from OpenRouter');
            }

            // Clean up — strip markdown fences if present
            let cleaned = text.trim();
            const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (jsonMatch) {
                cleaned = jsonMatch[1].trim();
            } else {
                // Try to find first { and last }
                const firstBrace = cleaned.indexOf('{');
                const lastBrace = cleaned.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
                }
            }

            return JSON.parse(cleaned) as T;
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            const status = (error as { status?: number })?.status;

            // Immediately rethrow abort/timeout errors to avoid masking
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((error instanceof Error && error.name === 'AbortError') || (error as any).code === 'ETIMEDOUT' || errMsg.includes('timeout') || errMsg.includes('timed out')) {
                throw error;
            }

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
