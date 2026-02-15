import { generateJSON } from '../ai/geminiClient';
import { IInterviewQuestion, IRuleResult } from '../db/models/InterviewSession';
import { ICanvasNode, IConnection } from '../db/models/Design';

export interface ReasoningEvaluation {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
}

/**
 * Uses AI to evaluate the qualitative aspects of the design
 */
export async function evaluateReasoning(
    question: IInterviewQuestion,
    canvasSnapshot: { nodes: ICanvasNode[]; connections: IConnection[] },
    structuralResults: IRuleResult[]
): Promise<ReasoningEvaluation> {
    const prompt = `
You are a senior system design interviewer at a top-tier tech company. 
Evaluate the following candidate design based on the provided question and architectural constraints.

### THE QUESTION
Prompt: ${question.prompt}
Requirements: ${question.requirements.join(', ')}
Constraints: ${question.constraints.join(', ')}
Traffic Profile: ${JSON.stringify(question.trafficProfile)}

### CANDIDATE DESIGN (JSON Structure)
Nodes: ${JSON.stringify(canvasSnapshot.nodes.map(n => ({ id: n.id, type: n.type, label: n.label })))}
Connections: ${JSON.stringify(canvasSnapshot.connections.map(c => ({ from: c.from, to: c.to })))}

### DETERMINISTIC CHECKS
${structuralResults.map(r => `- ${r.rule}: ${r.status.toUpperCase()} (${r.message})`).join('\n')}

### EVALUATION CRITERIA
1. Does it meet ALL functional requirements qualitatively?
2. Are trade-offs appropriate for the specific scale constraints?
3. Are there hidden bottlenecks that the deterministic checks missed?
4. Is the overall architecture coherent and justified?

Return your evaluation as a structured JSON object.
    `;

    try {
        const evaluation = await generateJSON<ReasoningEvaluation>(prompt);

        // Ensure valid score range
        if (typeof evaluation.score !== 'number') evaluation.score = 70;
        evaluation.score = Math.max(0, Math.min(100, evaluation.score));

        // Ensure arrays exist
        evaluation.strengths = evaluation.strengths || [];
        evaluation.weaknesses = evaluation.weaknesses || [];
        evaluation.suggestions = evaluation.suggestions || [];

        return evaluation;
    } catch (error) {
        console.error('AI Reasoning Evaluation failed:', error);
        // Fallback evaluation if AI fails
        return {
            score: 50,
            strengths: ['Basic structure present'],
            weaknesses: ['AI feedback unavailable at this time'],
            suggestions: ['Please review your design against functional requirements manually']
        };
    }
}
