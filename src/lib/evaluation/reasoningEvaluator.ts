import { generateJSON } from '../ai/geminiClient';
import { IInterviewQuestion, IRuleResult, IConstraintChange } from '../db/models/InterviewSession';
import { ICanvasNode, IConnection } from '../db/models/Design';

export interface ReasoningEvaluation {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    adaptationSummary?: string;
    addressedConstraintChanges?: string[];
    missedConstraintChanges?: string[];
}

/**
 * Uses AI to evaluate the qualitative aspects of the design
 */
export async function evaluateReasoning(
    question: IInterviewQuestion,
    canvasSnapshot: { nodes: ICanvasNode[]; connections: IConnection[] },
    structuralResults: IRuleResult[],
    constraintChanges: IConstraintChange[] = []
): Promise<ReasoningEvaluation> {
    const activeConstraintText = constraintChanges.length > 0
        ? constraintChanges.map((change) =>
            `- [${change.type}] ${change.title}: ${change.description} (introduced at minute ${change.introducedAtMinute})`
        ).join('\n')
        : 'None';

    const prompt = `
You are a senior system design interviewer at a top-tier tech company. 
Evaluate the following candidate design based on the provided question and architectural constraints.

### THE QUESTION
Prompt: ${question.prompt}
Requirements: ${question.requirements.join(', ')}
Constraints: ${question.constraints.join(', ')}
Traffic Profile: ${JSON.stringify(question.trafficProfile)}

### LIVE CONSTRAINT CHANGES
${activeConstraintText}

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
5. If live constraint changes were introduced, did the candidate adapt the design appropriately?
   - **Full credit** (+15 pts): constraint is clearly addressed with the right components and reasoning.
   - **Partial credit** (+5–10 pts): candidate acknowledged the constraint and made some adjustments but the solution is incomplete or has gaps.
   - **No credit** (0 pts): constraint was ignored or the design shows no response to it.

### OUTPUT FORMAT
Return your evaluation as a structured JSON object with the following exact keys:
- "score": number (0-100 indicating overall architectural quality)
- "strengths": string[] (list of 2-3 specific architectural strengths)
- "weaknesses": string[] (list of 2-3 specific architectural gaps or weaknesses)
- "suggestions": string[] (list of 2-3 actionable steps to improve the design)
- "adaptationSummary": string (1-2 sentences describing how well the candidate handled any live changes)
- "addressedConstraintChanges": string[] (titles of live changes the design addressed well)
- "missedConstraintChanges": string[] (titles of live changes the design failed to address)

Ensure the JSON is well-formatted and strictly valid.
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
        evaluation.adaptationSummary = evaluation.adaptationSummary || undefined;
        evaluation.addressedConstraintChanges = evaluation.addressedConstraintChanges || [];
        evaluation.missedConstraintChanges = evaluation.missedConstraintChanges || [];

        return evaluation;
    } catch (error) {
        console.error('AI Reasoning Evaluation failed:', error);
        // Fallback evaluation if AI fails
        return {
            score: 50,
            strengths: ['Basic structure present'],
            weaknesses: ['AI feedback unavailable at this time'],
            suggestions: ['Please review your design against functional requirements manually'],
            adaptationSummary: constraintChanges.length > 0
                ? 'Live constraint changes were introduced, but adaptation analysis was unavailable.'
                : 'No live constraint changes were introduced.',
            addressedConstraintChanges: [],
            missedConstraintChanges: constraintChanges.map((change) => change.title)
        };
    }
}
