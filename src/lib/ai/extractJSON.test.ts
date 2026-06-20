import { describe, it, expect } from 'vitest';
import { extractJSON } from './extractJSON';

describe('extractJSON', () => {
    // ── Clean JSON (no wrapping) ─────────────────────────────────────
    it('returns clean JSON as-is', () => {
        const input = '{"message":"hello"}';
        expect(extractJSON(input)).toBe('{"message":"hello"}');
    });

    it('trims leading/trailing whitespace', () => {
        const input = '   {"a":1}   ';
        expect(extractJSON(input)).toBe('{"a":1}');
    });

    // ── Markdown fenced blocks ───────────────────────────────────────
    it('extracts from ```json fenced block', () => {
        const input = '```json\n{"message":"hello"}\n```';
        expect(extractJSON(input)).toBe('{"message":"hello"}');
    });

    it('extracts from ``` fenced block (no language tag)', () => {
        const input = '```\n{"key":"value"}\n```';
        expect(extractJSON(input)).toBe('{"key":"value"}');
    });

    it('handles fenced block with conversational padding', () => {
        const input = 'Here is your response:\n```json\n{"score":42}\n```\nHope this helps!';
        expect(extractJSON(input)).toBe('{"score":42}');
    });

    it('handles fenced block with extra whitespace inside', () => {
        const input = '```json\n\n  {"spaced": true}  \n\n```';
        expect(extractJSON(input)).toBe('{"spaced": true}');
    });

    // ── Brace extraction fallback ────────────────────────────────────
    it('extracts JSON from conversational text using brace matching', () => {
        const input = 'Sure! Here is the data: {"name":"test","value":123} Let me know if you need more.';
        expect(extractJSON(input)).toBe('{"name":"test","value":123}');
    });

    it('handles nested braces correctly', () => {
        const input = 'Result: {"outer":{"inner":"value"}}';
        const result = JSON.parse(extractJSON(input));
        expect(result).toEqual({ outer: { inner: 'value' } });
    });

    // ── Array extraction ─────────────────────────────────────────────
    it('extracts JSON arrays', () => {
        const input = 'Here are the items: [1, 2, 3]';
        expect(extractJSON(input)).toBe('[1, 2, 3]');
    });

    it('prefers object over array when object comes first', () => {
        const input = '{"a":1} and [1,2]';
        expect(extractJSON(input)).toBe('{"a":1}');
    });

    // ── Edge cases ───────────────────────────────────────────────────
    it('returns raw input when no JSON-like structure is found', () => {
        const input = 'No JSON here at all';
        expect(extractJSON(input)).toBe('No JSON here at all');
    });

    it('handles empty string', () => {
        expect(extractJSON('')).toBe('');
    });

    it('produces parseable JSON from a real-world AI response', () => {
        const aiResponse = `Sure! Here's the interview question:

\`\`\`json
{
  "message": "Design a URL shortener like bit.ly",
  "requirements": ["handle 100M URLs", "low latency reads"],
  "difficulty": "medium"
}
\`\`\`

Let me know if you want a different topic!`;

        const parsed = JSON.parse(extractJSON(aiResponse));
        expect(parsed.message).toBe('Design a URL shortener like bit.ly');
        expect(parsed.requirements).toHaveLength(2);
        expect(parsed.difficulty).toBe('medium');
    });
});
