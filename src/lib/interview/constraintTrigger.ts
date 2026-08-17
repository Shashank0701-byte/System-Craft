import { ICanvasNode, IConnection } from '../db/models/Design';
import { IConstraintChange } from '../db/models/InterviewSession';

export const LIVE_CHANGE_MIN_PROGRESS = 0.25;
export const LIVE_CHANGE_MIN_NODES = 3;

export interface ConstraintTriggerSession {
    difficulty: 'easy' | 'medium' | 'hard';
    constraintChanges?: IConstraintChange[];
    startedAt: Date | string;
    timeLimit: number;
}

/**
 * Fall back to the snapshot only when the client canvas is truly empty.
 * Otherwise, prefer the live client canvas to respect deletions.
 */
export function resolveConstraintCanvas(
    clientNodes: ICanvasNode[],
    clientConnections: IConnection[],
    snapshot?: { nodes?: ICanvasNode[]; connections?: IConnection[] } | null
): { nodes: ICanvasNode[]; connections: IConnection[]; nodeCount: number } {
    const snapshotNodes = snapshot?.nodes ?? [];
    const snapshotConnections = snapshot?.connections ?? [];

    if (clientNodes.length === 0 && snapshotNodes.length > 0) {
        return {
            nodes: snapshotNodes,
            connections: snapshotConnections,
            nodeCount: snapshotNodes.length,
        };
    }

    return {
        nodes: clientNodes,
        connections: clientConnections,
        nodeCount: clientNodes.length,
    };
}

/**
 * Decide whether to inject a live chaos constraint for this hint request.
 * Eligibility is sticky after 25% of the interview — there is no upper bound,
 * so a missed poll cannot permanently lock out the session.
 */
export function shouldTriggerConstraintChange(
    session: ConstraintTriggerSession,
    nodeCount: number,
    nowMs: number = Date.now()
): { shouldTrigger: boolean; introducedAtMinute: number } {
    if ((session.constraintChanges || []).length > 0) {
        return { shouldTrigger: false, introducedAtMinute: 0 };
    }

    if (nodeCount < LIVE_CHANGE_MIN_NODES) {
        return { shouldTrigger: false, introducedAtMinute: 0 };
    }

    const startedAt = new Date(session.startedAt).getTime();
    if (isNaN(startedAt)) {
        return { shouldTrigger: false, introducedAtMinute: 0 };
    }

    const elapsedMinutes = Math.max(0, Math.floor((nowMs - startedAt) / (1000 * 60)));
    const progress = session.timeLimit > 0 ? elapsedMinutes / session.timeLimit : 0;

    if (progress < LIVE_CHANGE_MIN_PROGRESS) {
        return { shouldTrigger: false, introducedAtMinute: elapsedMinutes };
    }

    return { shouldTrigger: true, introducedAtMinute: elapsedMinutes };
}
