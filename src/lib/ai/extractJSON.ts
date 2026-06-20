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

    // Strategy 2: extract balanced JSON using depth tracking
    const firstBrace = trimmed.indexOf('{');
    const firstBracket = trimmed.indexOf('[');

    // Pick whichever delimiter comes first
    const useObject = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket);
    const startIndex = useObject ? firstBrace : firstBracket;

    if (startIndex === -1) {
        // No opening delimiter found
        return trimmed;
    }

    // Track nesting depth to find the balanced closing delimiter
    let depth = 0;
    const openChar = trimmed[startIndex];
    const closeChar = openChar === '{' ? '}' : ']';

    for (let i = startIndex; i < trimmed.length; i++) {
        const char = trimmed[i];
        if (char === openChar) {
            depth++;
        } else if (char === closeChar) {
            depth--;
            if (depth === 0) {
                // Found the balanced closing delimiter
                return trimmed.substring(startIndex, i + 1);
            }
        }
    }

    // No balanced closing delimiter found, fall back to Strategy 3
    // Strategy 3: return as-is and let the caller handle the parse error
    return trimmed;
}
