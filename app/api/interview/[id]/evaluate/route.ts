import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { isValidObjectId } from '@/src/lib/db/mongoose';
import InterviewSession from '@/src/lib/db/models/InterviewSession';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';
import { evaluateStructure } from '@/src/lib/evaluation/structuralRules';
import { evaluateReasoning } from '@/src/lib/evaluation/reasoningEvaluator';
import { combineEvaluations } from '@/src/lib/evaluation/scoringEngine';
import { withMetrics } from '@/src/lib/withMetrics';
import { trackMetric, setMetricIfHigher } from '@/src/lib/achievements/trackMetric';
import { awardXP } from '@/src/lib/achievements/xp';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST: Trigger evaluation of a submitted interview session
export const POST = withMetrics('/api/interview/[id]/evaluate', async (request: NextRequest, { params }: RouteParams) => {
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
        let session = await InterviewSession.findOneAndUpdate(
            { _id: id, userId: user._id, status: 'submitted' },
            { $set: { status: 'evaluating' } },
            { new: false } // return the pre-update doc so we can inspect canvas
        );

        // If not found as 'submitted', check if it's stuck in 'evaluating' (stale > 2 min)
        if (!session) {
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            session = await InterviewSession.findOneAndUpdate(
                { _id: id, userId: user._id, status: 'evaluating', updatedAt: { $lt: twoMinutesAgo } },
                { $set: { status: 'evaluating' } },
                { new: false }
            );
        }

        // Also allow re-evaluation of already-evaluated sessions (user-triggered)
        if (!session) {
            session = await InterviewSession.findOneAndUpdate(
                { _id: id, userId: user._id, status: 'evaluated' },
                { $set: { status: 'evaluating' } },
                { new: false }
            );
        }

        if (!session) {
            // Distinguish between "not found" and "wrong status"
            const exists = await InterviewSession.findOne({ _id: id, userId: user._id }).select('status').lean();
            if (!exists) {
                return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
            }
            return NextResponse.json(
                { error: `Cannot evaluate session with status "${exists.status}". Session must be "submitted", "evaluated", or stuck in "evaluating" for >2 minutes to be evaluated.` },
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
                structuralResults.details,
                session.constraintChanges || []
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

            // Track achievement metrics from this evaluation (fire-and-forget)
            if (updated?.evaluation) {
                const finalScore = updated.evaluation.finalScore ?? 0;
                const passedRules = updated.evaluation.structural?.passedRules ?? [];
                const nodeTypes = new Set((nodes as { type: string }[]).map((n) => n.type));
                const constraintChanges = session.constraintChanges ?? [];
                const addressedConstraints = constraintChanges.filter(
                    (c) => c.status === 'addressed'
                ).length;

                // Fetch recent evaluated sessions to compute historical metrics
                const recentSessions = await InterviewSession.find({
                    userId: user._id,
                    status: 'evaluated',
                    _id: { $ne: id },
                })
                    .sort({ submittedAt: -1 })
                    .limit(20)
                    .select('evaluation.finalScore difficulty submittedAt')
                    .lean();

                const recentScores = recentSessions
                    .map((s) => s.evaluation?.finalScore ?? 0)
                    .filter((s) => s > 0);

                // High average: 90+ across at least 5 sessions (including current)
                const allScores = [finalScore, ...recentScores];
                const highAverageUnlocked =
                    allScores.length >= 5 &&
                    allScores.slice(0, 5).reduce((a, b) => a + b, 0) / 5 >= 90
                        ? 1
                        : 0;

                // Comeback: improved by 20+ vs best previous score of same difficulty
                const sameDifficultyScores = recentSessions
                    .filter((s) => s.difficulty === session.difficulty)
                    .map((s) => s.evaluation?.finalScore ?? 0);
                const previousBest = sameDifficultyScores.length > 0
                    ? Math.max(...sameDifficultyScores)
                    : null;
                const comebackUnlocked =
                    previousBest !== null && finalScore - previousBest >= 20 ? 1 : 0;

                // Consistent performer streak: consecutive 80+ scores
                let streakCount = finalScore >= 80 ? 1 : 0;
                if (streakCount > 0) {
                    for (const s of recentScores) {
                        if (s >= 80) streakCount++;
                        else break;
                    }
                }

                // Difficulties with 90+
                const difficultiesWithHighScore = new Set(
                    recentSessions
                        .filter((s) => (s.evaluation?.finalScore ?? 0) >= 90)
                        .map((s) => s.difficulty)
                );
                if (finalScore >= 90) difficultiesWithHighScore.add(session.difficulty);

                // Build metric patch from evaluation results
                const metricPatch: Record<string, number> = {
                    interviewsCompleted: 1,
                    ...(highAverageUnlocked ? { highAverageUnlocked: 1 } : {}),
                    ...(comebackUnlocked ? { comebackUnlocked: 1 } : {}),
                    consistentPerformerStreak: streakCount,
                    highScoreAcrossDifficulties: difficultiesWithHighScore.size,
                };

                if (finalScore === 100) metricPatch.perfectScores = 1;
                if (addressedConstraints > 0) metricPatch.chaosConstraintsAddressed = addressedConstraints;

                // Infrastructure component usage (count each type present in canvas)
                if (nodeTypes.has('Cache')) metricPatch.cacheImplementations = 1;
                if (nodeTypes.has('LB'))    metricPatch.loadBalancerImplementations = 1;
                if (nodeTypes.has('SQL') || nodeTypes.has('NoSQL') || nodeTypes.has('GraphDB')) {
                    metricPatch.databaseImplementations = 1;
                }
                if (nodeTypes.has('Queue') || nodeTypes.has('Kafka') || nodeTypes.has('PubSub')) {
                    metricPatch.messagingImplementations = 1;
                }
                if (nodeTypes.has('CDN')) metricPatch.cdnImplementations = 1;
                if (nodeTypes.has('Gateway')) metricPatch.apiGatewayImplementations = 1;

                // Distributed systems signals from structural rule passes
                if (passedRules.some((r: string) => /shard/i.test(r)))           metricPatch.shardingApplications = 1;
                if (passedRules.some((r: string) => /replica/i.test(r)))          metricPatch.replicationApplications = 1;
                if (passedRules.some((r: string) => /rate.limit/i.test(r)))       metricPatch.rateLimitingApplications = 1;
                if (passedRules.some((r: string) => /circuit/i.test(r)))          metricPatch.circuitBreakerApplications = 1;
                if (passedRules.some((r: string) => /fault|tolerance/i.test(r)))  metricPatch.faultToleranceImplementations = 1;
                if (passedRules.some((r: string) => /ha|high.avail/i.test(r)))    metricPatch.highAvailabilityDesigns = 1;

                const bonusXP = finalScore >= 100 ? 50 : finalScore >= 90 ? 25 : 0;

                Promise.all([
                    trackMetric(user._id, metricPatch),
                    awardXP(user._id, 'INTERVIEW_COMPLETED', bonusXP),
                    setMetricIfHigher(user._id, 'maxNodesInSingleDesign', nodeCount),
                ]).catch((err) =>
                    console.error('Achievement tracking failed (interview evaluate):', err)
                );
            }

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
});
