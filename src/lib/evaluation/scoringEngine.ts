import { IEvaluation } from '../db/models/InterviewSession';
import { StructuralEvaluation } from './structuralRules';
import { ReasoningEvaluation } from './reasoningEvaluator';

const WEIGHTS = {
    structural: 0.6,
    reasoning: 0.4
};

/**
 * Combines structural and reasoning evaluations into a final score and record
 */
export function combineEvaluations(
    structural: StructuralEvaluation,
    reasoning: ReasoningEvaluation
): IEvaluation {
    const finalScore = Math.round(
        (structural.score * WEIGHTS.structural) +
        (reasoning.score * WEIGHTS.reasoning)
    );

    return {
        structural: {
            score: structural.score,
            passedRules: structural.passedRules,
            failedRules: structural.failedRules,
            details: structural.details
        },
        reasoning: {
            score: reasoning.score,
            strengths: reasoning.strengths,
            weaknesses: reasoning.weaknesses,
            suggestions: reasoning.suggestions
        },
        finalScore,
        weights: WEIGHTS
    };
}
