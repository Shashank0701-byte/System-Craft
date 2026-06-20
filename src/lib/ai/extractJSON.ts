/**
 * Extract and clean JSON from an AI response that may contain
 * markdown fences, conversational padding, or other non-JSON text.
 *
 * Strategy:
 * 1. Try to extract from ```json ... ``` fenced blocks.
 * 2. Fall back to extracting the outermost { ... } or [ ... ].
 * 3. Return the trimmed input as-is if neither pattern matches.
 */
export function extractJSON(raw: string): string {
    const trimmed = raw.trim();

    // Strategy 1: markdown fenced code block
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
        return fenceMatch[1].trim();
    }

    // Strategy 2: find first { and last } (or [ and ])
    const firstBrace = trimmed.indexOf('{');
    const firstBracket = trimmed.indexOf('[');
    const lastBrace = trimmed.lastIndexOf('}');
    const lastBracket = trimmed.lastIndexOf(']');

    // Pick whichever delimiter comes first
    const useObject = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket);
    if (useObject && lastBrace >= firstBrace) {
        return trimmed.substring(firstBrace, lastBrace + 1);
    }
    if (firstBracket !== -1 && lastBracket >= firstBracket) {
        return trimmed.substring(firstBracket, lastBracket + 1);
    }

    // Strategy 3: return as-is and let the caller handle the parse error
    return trimmed;
}
