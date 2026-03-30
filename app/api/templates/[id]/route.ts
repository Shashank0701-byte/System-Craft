import { NextResponse, NextRequest } from 'next/server';
import { curatedTemplates } from '@/src/lib/templates/curated';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        // Lookup requested template
        // In the future: also look up generated templates from the DB here
        const template = curatedTemplates.find(t => t.id === id);
        
        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        
        return NextResponse.json({ template });
    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
