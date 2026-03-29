import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import InterviewSession from '@/src/lib/db/models/InterviewSession';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await context.params;

        const session = await InterviewSession.findOne({ id });
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (!session.aiMessages) session.aiMessages = [];

        // Idempotency check: Have we already sent it?
        const alreadySent = session.aiMessages.some((m: any) => 
            m.role === 'interviewer' && m.content.includes("Final Validation Phase")
        );

        if (alreadySent || session.status !== 'in_progress') {
            return NextResponse.json({ success: true, messages: session.aiMessages });
        }

        session.aiMessages.push({
            role: 'interviewer',
            content: `**Final Validation Phase**: We have roughly 10 minutes left in the interview! It's time to test your architecture's resiliency. Please turn to the **Simulation Controls** panel, hit 'Run Test', and use the **Target Throughput** slider to simulate traffic. Talk me through how your system behaves under different load scenarios, and point out any bottlenecks.`,
            timestamp: new Date()
        });
        session.markModified('aiMessages');
        await session.save();

        return NextResponse.json({ success: true, messages: session.aiMessages });
    } catch (error) {
        console.error('Final Validation Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
