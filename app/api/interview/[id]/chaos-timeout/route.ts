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
        const { type, constraintId } = await req.json();

        // 1. Fetch Session
        const session = await InterviewSession.findOne({ id });
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 2. Locate Constraint
        const constraintChanges = session.constraintChanges || [];
        const constraintIndex = constraintChanges.findIndex((c: any) => c.id === constraintId);
        if (constraintIndex === -1) {
            return NextResponse.json({ error: 'Constraint not found' }, { status: 404 });
        }

        const constraint = constraintChanges[constraintIndex];

        // 3. Early Returns (already addressed or failed)
        if (constraint.status === 'addressed' || (type === 'warning' && constraint.overtimeAt) || (type === 'penalty' && constraint.failedAt)) {
            return NextResponse.json({ success: true, warning: 'Already processed' });
        }

        if (!session.aiMessages) session.aiMessages = [];

        // 4. Update state depending on timeout type
        if (type === 'warning') {
            constraint.overtimeAt = new Date();
            session.aiMessages.push({
                role: 'interviewer',
                content: `Hey, I noticed we still haven't addressed the ${constraint.title} issue. In a real-world scenario, leaving a failure like this unhandled could lead to a broader system outage. Could you walk me through how you'd mitigate this in the next 2 minutes? Let's treat this as a high-priority incident.`,
                timestamp: new Date()
            });
            session.markModified('constraintChanges');
            session.markModified('aiMessages');
        } else if (type === 'penalty') {
            constraint.failedAt = new Date();
            // We keep status as 'active' so the UI node stays visibly broken
            session.aiMessages.push({
                role: 'interviewer',
                content: `Alright, time's up on the ${constraint.title} scenario. Since we weren't able to establish a complete mitigation plan in time, I'll be noting this gap in high-availability planning for the evaluation. That said, let's keep moving forward with the rest of your system design—what were you thinking for the next component?`,
                timestamp: new Date()
            });
            session.markModified('constraintChanges');
            session.markModified('aiMessages');
        }

        await session.save();

        return NextResponse.json({ success: true, messages: session.aiMessages, constraintChanges: session.constraintChanges });
    } catch (error) {
        console.error('Chaos Timeout Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
