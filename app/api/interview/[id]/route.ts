import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { isValidObjectId } from '@/src/lib/db/mongoose';
import InterviewSession from '@/src/lib/db/models/InterviewSession';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Fetch a specific interview session
export async function GET(request: NextRequest, { params }: RouteParams) {
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

        return NextResponse.json({
            session: {
                id: session._id.toString(),
                question: session.question,
                difficulty: session.difficulty,
                timeLimit: session.timeLimit,
                startedAt: session.startedAt,
                submittedAt: session.submittedAt,
                status: session.status,
                canvasSnapshot: session.canvasSnapshot,
                evaluation: session.evaluation ?? null,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error fetching interview session:', error);
        return NextResponse.json(
            { error: 'Failed to fetch interview session' },
            { status: 500 }
        );
    }
}

// PUT: Update interview session (auto-save canvas or submit)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { action, nodes, connections } = body;

        // Validate action
        if (!action || !['save', 'submit'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Must be one of: save, submit' },
                { status: 400 }
            );
        }

        // Validate input shapes
        if (nodes !== undefined && !Array.isArray(nodes)) {
            return NextResponse.json(
                { error: 'nodes must be an array' },
                { status: 400 }
            );
        }
        if (connections !== undefined && !Array.isArray(connections)) {
            return NextResponse.json(
                { error: 'connections must be an array' },
                { status: 400 }
            );
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

        // Build update
        const updateData: Record<string, unknown> = {};

        // Save canvas snapshot
        if (nodes !== undefined) {
            updateData['canvasSnapshot.nodes'] = nodes;
        }
        if (connections !== undefined) {
            updateData['canvasSnapshot.connections'] = connections;
        }

        // Submit action: freeze the session
        if (action === 'submit') {
            updateData.status = 'submitted';
            updateData.submittedAt = new Date();
        }

        // Atomic update with status guard: only update if session is still 'in_progress'
        // This prevents race conditions where a concurrent request submits between our check and update
        const updatedSession = await InterviewSession.findOneAndUpdate(
            { _id: id, userId: user._id, status: 'in_progress' },
            { $set: updateData },
            { new: true }
        );

        if (!updatedSession) {
            // Distinguish between "not found" and "wrong status"
            const exists = await InterviewSession.findOne({ _id: id, userId: user._id }).select('status').lean();
            if (!exists) {
                return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
            }
            return NextResponse.json(
                { error: 'Cannot modify a submitted session' },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            session: {
                id: updatedSession._id.toString(),
                status: updatedSession.status,
                submittedAt: updatedSession.submittedAt,
                nodeCount: (updatedSession.canvasSnapshot?.nodes || []).length,
                connectionCount: (updatedSession.canvasSnapshot?.connections || []).length,
                updatedAt: updatedSession.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error updating interview session:', error);
        return NextResponse.json(
            { error: 'Failed to update interview session' },
            { status: 500 }
        );
    }
}
