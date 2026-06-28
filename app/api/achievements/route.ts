import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import User from '@/src/lib/db/models/User';
import UserMetrics from '@/src/lib/achievements/metrics';
import { getUserAchievementState } from '@/src/lib/achievements/engine';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

// GET /api/achievements
// Fetches the authenticated user's current achievement state, metrics, and XP.
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

        // 1. Get the computed achievements state (array of definitions with user progress)
        const achievements = await getUserAchievementState(user._id);

        // 2. Get raw metrics for XP, level, heatmaps, and pinned badges
        const metrics = await UserMetrics.findOne({ userId: user._id }).lean();

        // If no metrics document exists yet, provide a baseline
        const baseMetrics = metrics || {
            totalXP: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
            activityHeatmap: {},
            pinnedAchievements: [],
        };

        const safeMetrics: Record<string, unknown> = { ...baseMetrics };
        delete safeMetrics._id;
        delete safeMetrics.userId;
        delete safeMetrics.__v;
        delete safeMetrics.createdAt;
        delete safeMetrics.updatedAt;

        if (safeMetrics.activityHeatmap instanceof Map) {
            safeMetrics.activityHeatmap = Object.fromEntries(safeMetrics.activityHeatmap);
        } else if (!safeMetrics.activityHeatmap) {
            safeMetrics.activityHeatmap = {};
        }

        return NextResponse.json({
            success: true,
            achievements,
            metrics: safeMetrics
        });

    } catch (error) {
        console.error('Error fetching achievements:', error);
        return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }
}
