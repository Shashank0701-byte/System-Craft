import { NextResponse } from 'next/server';
import { curatedTemplates } from '@/src/lib/templates/curated';

export async function GET() {
    try {
        // Return summary of curated templates for the listing page
        const summaries = curatedTemplates.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            difficulty: t.difficulty,
            targetRps: t.targetRps
        }));
        
        return NextResponse.json({ templates: summaries });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
