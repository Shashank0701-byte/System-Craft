import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

/**
 * Get or initialize the Gemini generative model.
 * Uses gemini-2.0-flash for speed and cost efficiency.
 */
export function getGeminiModel(): GenerativeModel {
    if (model) return model;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
            temperature: 0.8,      // creative but structured
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json', // force JSON output
        },
    });

    return model;
}

/**
 * Generate content from Gemini with retry logic.
 * Returns the parsed JSON response or throws on failure.
 */
export async function generateJSON<T>(prompt: string, retries = 2): Promise<T> {
    const gemini = getGeminiModel();

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const result = await gemini.generateContent(prompt);
            const text = result.response.text();

            // Clean up response — strip markdown fences if present
            const cleaned = text
                .replace(/^```json\s*/i, '')
                .replace(/```\s*$/, '')
                .trim();

            return JSON.parse(cleaned) as T;
        } catch (error) {
            if (attempt === retries) {
                console.error(`Gemini generation failed after ${retries + 1} attempts:`, error);
                throw new Error('Failed to generate AI content. Please try again.');
            }
            // Brief backoff before retry
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
    }

    // TypeScript exhaustiveness — should never reach here
    throw new Error('Unreachable');
}
