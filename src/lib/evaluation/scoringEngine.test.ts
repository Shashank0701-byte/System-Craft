import { describe, it, expect } from 'vitest';
import { combineEvaluations } from './scoringEngine';
import type { StructuralEvaluation } from './structuralRules';
import type { ReasoningEvaluation } from './reasoningEvaluator';

// ── Helpers ──────────────────────────────────────────────────────────
function structural(score: number): StructuralEvaluation {
    return {
        score,
        passedRules: ['rule1'],
        failedRules: [],
        details: [{ rule: 'rule1', status: 'pass', message: 'ok', severity: 'info' }],
    };
}

function reasoning(score: number): ReasoningEvaluation {
    return {
        score,
        strengths: ['good'],
        weaknesses: [],
        suggestions: [],
        adaptationSummary: '',
        addressedConstraintChanges: [],
        missedConstraintChanges: [],
    };
}

// ── Tests ────────────────────────────────────────────────────────────
describe('combineEvaluations', () => {
    it('computes weighted average (60% structural, 40% reasoning)', () => {
        // structural=100, reasoning=0 → 100*0.6 + 0*0.4 = 60
        const result = combineEvaluations(structural(100), reasoning(0));
        expect(result.finalScore).toBe(60);
    });

    it('returns 100 when both scores are 100', () => {
        const result = combineEvaluations(structural(100), reasoning(100));
        expect(result.finalScore).toBe(100);
    });

    it('returns 0 when both scores are 0', () => {
        const result = combineEvaluations(structural(0), reasoning(0));
        expect(result.finalScore).toBe(0);
    });

    it('rounds the final score to the nearest integer', () => {
        // 75*0.6 + 85*0.4 = 45 + 34 = 79
        const result = combineEvaluations(structural(75), reasoning(85));
        expect(result.finalScore).toBe(79);
    });

    it('preserves structural and reasoning fields in the output', () => {
        const result = combineEvaluations(structural(80), reasoning(70));

        expect(result.structural.score).toBe(80);
        expect(result.reasoning.score).toBe(70);
        expect(result.weights).toEqual({ structural: 0.6, reasoning: 0.4 });
    });

    it('passes through reasoning metadata', () => {
        const r = reasoning(90);
        r.strengths = ['scalable', 'fault-tolerant'];
        r.weaknesses = ['no caching'];
        r.suggestions = ['add Redis'];
        r.adaptationSummary = 'Good adaptation';
        r.addressedConstraintChanges = ['added replicas'];
        r.missedConstraintChanges = ['missed CDN'];

        const result = combineEvaluations(structural(80), r);

        expect(result.reasoning.strengths).toEqual(['scalable', 'fault-tolerant']);
        expect(result.reasoning.weaknesses).toEqual(['no caching']);
        expect(result.reasoning.suggestions).toEqual(['add Redis']);
        expect(result.reasoning.adaptationSummary).toBe('Good adaptation');
        expect(result.reasoning.addressedConstraintChanges).toEqual(['added replicas']);
        expect(result.reasoning.missedConstraintChanges).toEqual(['missed CDN']);
    });
});
