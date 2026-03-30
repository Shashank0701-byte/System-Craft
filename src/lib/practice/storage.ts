// Practice persistence helpers
// Shared module so both the listing page and drill page use the same logic.

import type { CanvasNode, Connection } from '@/components/canvas/DesignCanvas';

const SOLVED_KEY = 'practice_solved';
const progressKey = (id: string) => `practice_progress_${id}`;

export function getSavedProgress(templateId: string): { nodes: CanvasNode[]; connections: Connection[] } | null {
    try {
        const data = localStorage.getItem(progressKey(templateId));
        return data ? JSON.parse(data) : null;
    } catch { return null; }
}

export function saveProgress(templateId: string, nodes: CanvasNode[], connections: Connection[]) {
    try {
        localStorage.setItem(progressKey(templateId), JSON.stringify({ nodes, connections }));
    } catch { /* quota exceeded — silently fail */ }
}

export function clearProgress(templateId: string) {
    try { localStorage.removeItem(progressKey(templateId)); } catch { /* ignore */ }
}

export function getSolvedIds(): string[] {
    try {
        return JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]') as string[];
    } catch { return []; }
}

export function isSolved(templateId: string): boolean {
    return getSolvedIds().includes(templateId);
}

export function markSolved(templateId: string) {
    try {
        const solved = getSolvedIds();
        if (!solved.includes(templateId)) {
            solved.push(templateId);
            localStorage.setItem(SOLVED_KEY, JSON.stringify(solved));
        }
    } catch { /* silently fail */ }
}

export function unmarkSolved(templateId: string) {
    try {
        const solved = getSolvedIds().filter(s => s !== templateId);
        localStorage.setItem(SOLVED_KEY, JSON.stringify(solved));
    } catch { /* ignore */ }
}
