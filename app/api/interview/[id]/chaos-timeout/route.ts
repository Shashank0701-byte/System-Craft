import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import InterviewSession, { IConstraintChange } from '@/src/lib/db/models/InterviewSession';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        // Validate request body
        const { type, constraintId } = body;
        if (!type || (type !== 'warning' && type !== 'penalty')) {
            return new Response(JSON.stringify({ error: 'Invalid type. Must be "warning" or "penalty".' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        if (!constraintId || (typeof constraintId !== 'string' && typeof constraintId !== 'number') || constraintId === '') {
            return new Response(JSON.stringify({ error: 'Invalid constraintId. Must be a non-empty string or number.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);

        if (!authenticatedUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Fetch Session with ownership check
        const session = await InterviewSession.findOne({ id, userId: user._id });
        if (!session) {
            return NextResponse.json({ error: 'Session not found or access denied' }, { status: 403 });
        }
        if (session.status !== 'in_progress') {
            return NextResponse.json({ success: true, warning: 'Session is no longer in progress' });
        }

        // 2. Locate Constraint
        const constraintChanges = session.constraintChanges || [];
        const constraintIndex = constraintChanges.findIndex((c: IConstraintChange) => c.id === constraintId);
        if (constraintIndex === -1) {
            return NextResponse.json({ error: 'Constraint not found' }, { status: 404 });
        }

        const constraint = constraintChanges[constraintIndex];

        // 3. Early Returns (already addressed or failed)
        if (constraint.status === 'addressed' || constraint.failedAt || (type === 'warning' && constraint.overtimeAt)) {
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
            constraint.status = 'addressed';
            // We keep status as 'addressed' but the failedAt timestamp ensures it's tracked as a failure
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