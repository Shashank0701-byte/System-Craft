import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import InterviewSession from '@/src/lib/db/models/InterviewSession';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

// Free tier limit
const FREE_WEEKLY_LIMIT = 2;

// Time limits by difficulty (minutes)
const TIME_LIMITS: Record<string, number> = {
    easy: 30,
    medium: 45,
    hard: 60,
};

// Check if a week has passed and reset counter if needed
function getWeeklyUsage(user: { interviewAttempts?: { count: number; weekStart: Date } }) {
    const attempts = user.interviewAttempts || { count: 0, weekStart: new Date() };
    const now = new Date();
    const weekStart = new Date(attempts.weekStart);
    const daysSinceReset = (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceReset >= 7) {
        // Week has passed, reset
        return { count: 0, weekStart: now, needsReset: true };
    }

    return { count: attempts.count, weekStart: weekStart, needsReset: false };
}

// GET: List user's interview sessions
export async function GET(request: NextRequest) {
    try {
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

        // Parse query params for pagination
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
        const status = searchParams.get('status'); // optional filter

        const filter: Record<string, unknown> = { userId: user._id };
        if (status && ['in_progress', 'submitted', 'evaluating', 'evaluated'].includes(status)) {
            filter.status = status;
        }

        const [sessions, total] = await Promise.all([
            InterviewSession.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            InterviewSession.countDocuments(filter),
        ]);

        // Get weekly usage
        const usage = getWeeklyUsage(user);

        return NextResponse.json({
            sessions: sessions.map((session) => ({
                id: session._id.toString(),
                difficulty: session.difficulty,
                questionPrompt: session.question.prompt,
                status: session.status,
                timeLimit: session.timeLimit,
                startedAt: session.startedAt,
                submittedAt: session.submittedAt,
                finalScore: session.evaluation?.finalScore ?? null,
                nodeCount: (session.canvasSnapshot?.nodes || []).length,
                createdAt: session.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            usage: {
                used: usage.count,
                limit: user.plan === 'free' ? FREE_WEEKLY_LIMIT : null, // null = unlimited
                plan: user.plan,
            },
        });
    } catch (error) {
        console.error('Error fetching interview sessions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch interview sessions' },
            { status: 500 }
        );
    }
}

// POST: Start a new interview session
export async function POST(request: NextRequest) {
    try {
        // Parse body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { difficulty } = body;

        // Validate difficulty
        if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
            return NextResponse.json(
                { error: 'Invalid difficulty. Must be one of: easy, medium, hard' },
                { status: 400 }
            );
        }

        // Auth
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

        // Atomic counter claim for free plan: increment-and-check in one operation
        // This prevents race conditions where two concurrent requests both pass the limit check
        if (user.plan === 'free') {
            const usage = getWeeklyUsage(user);

            // If week has passed, reset counter atomically and claim a slot
            if (usage.needsReset) {
                const claimed = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $set: { 'interviewAttempts.count': 1, 'interviewAttempts.weekStart': new Date() } },
                    { new: true }
                );
                if (!claimed) {
                    return NextResponse.json({ error: 'Failed to claim interview slot' }, { status: 500 });
                }
            } else {
                // Atomically increment only if count is still below limit
                const claimed = await User.findOneAndUpdate(
                    { _id: user._id, 'interviewAttempts.count': { $lt: FREE_WEEKLY_LIMIT } },
                    { $inc: { 'interviewAttempts.count': 1 } },
                    { new: true }
                );
                if (!claimed) {
                    return NextResponse.json(
                        {
                            error: 'Weekly interview limit reached',
                            message: `Free plan allows ${FREE_WEEKLY_LIMIT} interviews per week. Upgrade to Pro for unlimited.`,
                            usage: { used: usage.count, limit: FREE_WEEKLY_LIMIT },
                        },
                        { status: 429 }
                    );
                }
            }
        }

        // Placeholder question — Phase 2 will replace this with AI generation
        const placeholderQuestion = {
            prompt: `Design a system for a ${difficulty}-level challenge. (AI-generated question coming in Phase 2)`,
            requirements: [
                'Handle user authentication',
                'Support real-time data updates',
                'Provide data persistence',
            ],
            constraints: [
                difficulty === 'easy' ? 'Handle up to 100K users' :
                    difficulty === 'medium' ? 'Handle up to 10M users' :
                        'Handle up to 100M+ users',
            ],
            trafficProfile: {
                users: difficulty === 'easy' ? '100K DAU' : difficulty === 'medium' ? '10M DAU' : '100M+ DAU',
                rps: difficulty === 'easy' ? '1K RPS' : difficulty === 'medium' ? '50K RPS' : '500K+ RPS',
            },
            hints: [],
        };

        // Create the session (counter already claimed above)
        let session;
        try {
            session = await InterviewSession.create({
                userId: user._id,
                question: placeholderQuestion,
                difficulty,
                timeLimit: TIME_LIMITS[difficulty],
                startedAt: new Date(),
                status: 'in_progress',
                canvasSnapshot: { nodes: [], connections: [] },
            });
        } catch (createError) {
            // Rollback: decrement counter if session creation failed
            if (user.plan === 'free') {
                await User.updateOne(
                    { _id: user._id },
                    { $inc: { 'interviewAttempts.count': -1 } }
                );
            }
            throw createError;
        }

        return NextResponse.json({
            success: true,
            session: {
                id: session._id.toString(),
                question: session.question,
                difficulty: session.difficulty,
                timeLimit: session.timeLimit,
                startedAt: session.startedAt,
                status: session.status,
            },
        });
    } catch (error) {
        console.error('Error creating interview session:', error);
        return NextResponse.json(
            { error: 'Failed to create interview session' },
            { status: 500 }
        );
    }
}
