import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { isValidObjectId } from '@/src/lib/db/mongoose';
import InterviewSession from '@/src/lib/db/models/InterviewSession';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST: Trigger evaluation of a submitted interview session
// Phase 4 will add the actual structural rule engine + AI reasoning evaluator
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);

        if (!authenticatedUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const session = await InterviewSession.findOne({ _id: id, userId: user._id });
        if (!session) {
            return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
        }

        // Must be submitted to evaluate
        if (session.status !== 'submitted') {
            return NextResponse.json(
                { error: `Cannot evaluate session with status "${session.status}". Must be "submitted".` },
                { status: 409 }
            );
        }

        // Check canvas has content
        const nodeCount = session.canvasSnapshot?.nodes?.length || 0;
        if (nodeCount === 0) {
            return NextResponse.json(
                { error: 'Cannot evaluate an empty canvas. Add components before submitting.' },
                { status: 422 }
            );
        }

        // Set status to evaluating
        await InterviewSession.updateOne(
            { _id: id },
            { $set: { status: 'evaluating' } }
        );

        // TODO: Phase 4 — Run structural rule engine + AI reasoning evaluator
        // For now, return a stub response indicating evaluation is pending
        return NextResponse.json({
            success: true,
            message: 'Evaluation started. This is a Phase 1 stub — actual evaluation logic will be implemented in Phase 4.',
            session: {
                id: session._id.toString(),
                status: 'evaluating',
                nodeCount,
                connectionCount: session.canvasSnapshot?.connections?.length || 0,
            },
        });
    } catch (error) {
        console.error('Error triggering evaluation:', error);
        return NextResponse.json(
            { error: 'Failed to trigger evaluation' },
            { status: 500 }
        );
    }
}
