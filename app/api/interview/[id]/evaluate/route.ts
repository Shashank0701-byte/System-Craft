import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { isValidObjectId } from '@/src/lib/db/mongoose';
import InterviewSession from '@/src/lib/db/models/InterviewSession';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';
import { evaluateStructure } from '@/src/lib/evaluation/structuralRules';
import { evaluateReasoning } from '@/src/lib/evaluation/reasoningEvaluator';
import { combineEvaluations } from '@/src/lib/evaluation/scoringEngine';

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

        // Atomic check-and-set: only claim the session if it's currently 'submitted'
        // This prevents race conditions where two concurrent requests both pass the status check
        const session = await InterviewSession.findOneAndUpdate(
            { _id: id, userId: user._id, status: 'submitted' },
            { $set: { status: 'evaluating' } },
            { new: false } // return the pre-update doc so we can inspect canvas
        );

        if (!session) {
            // Distinguish between "not found" and "wrong status"
            const exists = await InterviewSession.findOne({ _id: id, userId: user._id }).select('status').lean();
            if (!exists) {
                return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
            }
            return NextResponse.json(
                { error: `Cannot evaluate session with status "${exists.status}". Must be "submitted".` },
                { status: 409 }
            );
        }

        // Check canvas has content
        const nodeCount = session.canvasSnapshot?.nodes?.length || 0;
        const nodes = session.canvasSnapshot?.nodes || [];
        const connections = session.canvasSnapshot?.connections || [];

        if (nodeCount === 0) {
            // Revert status back to submitted since we can't evaluate
            await InterviewSession.updateOne({ _id: id }, { $set: { status: 'submitted' } });
            return NextResponse.json(
                { error: 'Cannot evaluate an empty canvas. Add components before submitting.' },
                { status: 422 }
            );
        }

        try {
            // 1. Run deterministic structural evaluation
            const structuralResults = evaluateStructure(
                nodes,
                connections,
                session.question.requirements || [],
                session.question.constraints || []
            );

            // 2. Run AI qualitative evaluation
            const reasoningResults = await evaluateReasoning(
                session.question,
                session.canvasSnapshot,
                structuralResults.details
            );

            // 3. Combine into final evaluation document
            const fullEvaluation = combineEvaluations(structuralResults, reasoningResults);

            // 4. Save results and update status
            const updated = await InterviewSession.findByIdAndUpdate(
                id,
                {
                    $set: {
                        evaluation: fullEvaluation,
                        status: 'evaluated'
                    }
                },
                { new: true }
            );

            return NextResponse.json({
                success: true,
                message: 'Evaluation completed successfully',
                evaluation: updated?.evaluation,
                session: {
                    id: id,
                    status: 'evaluated',
                    finalScore: updated?.evaluation?.finalScore
                },
            });

        } catch (evalError) {
            console.error('Core evaluation logic failed:', evalError);
            // Revert status so user can retry
            await InterviewSession.updateOne({ _id: id }, { $set: { status: 'submitted' } });
            throw evalError;
        }
    } catch (error) {
        console.error('Error triggering evaluation:', error);
        return NextResponse.json(
            { error: 'Failed to trigger evaluation' },
            { status: 500 }
        );
    }
}
