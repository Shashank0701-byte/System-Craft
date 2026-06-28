import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';
import { getUserAchievementState } from '@/src/lib/achievements/engine';
import UserAchievement from '@/src/lib/achievements/userAchievement';

// GET /api/user/achievements — full achievement state for the current user
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);

        if (!authenticatedUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ firebaseUid: authenticatedUser.uid }).select('_id').lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const achievements = await getUserAchievementState(user._id);

        // Most recently unlocked (up to 5)
        const recentlyUnlocked = await UserAchievement.find({ userId: user._id })
            .sort({ unlockedAt: -1 })
            .limit(5)
            .lean();

        return NextResponse.json({
            achievements,
            recentlyUnlocked: recentlyUnlocked.map((u) => ({
                achievementId: u.achievementId,
                tier: u.tier,
                xpAwarded: u.xpAwarded,
                unlockedAt: u.unlockedAt,
            })),
        });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }
}

// PATCH /api/user/achievements — update pinned achievements
export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);

        if (!authenticatedUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { pinnedAchievements } = body;

        if (
            !Array.isArray(pinnedAchievements) ||
            pinnedAchievements.length > 6 ||
            !pinnedAchievements.every((id) => typeof id === 'string') ||
            new Set(pinnedAchievements).size !== pinnedAchievements.length
        ) {
            return NextResponse.json(
                { error: 'pinnedAchievements must be a unique array of up to 6 achievement IDs' },
                { status: 400 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ firebaseUid: authenticatedUser.uid }).select('_id').lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const unlockedIds = new Set(
            await UserAchievement.distinct('achievementId', {
                userId: user._id,
                achievementId: { $in: pinnedAchievements },
            })
        );

        if (!pinnedAchievements.every((id) => unlockedIds.has(id))) {
            return NextResponse.json(
                { error: 'Pinned achievements must be unlocked by the current user' },
                { status: 400 }
            );
        }

        const UserMetrics = (await import('@/src/lib/achievements/metrics')).default;
        await UserMetrics.findOneAndUpdate(
            { userId: user._id },
            { $set: { pinnedAchievements } },
            { upsert: true }
        );

        return NextResponse.json({ success: true, pinnedAchievements });
    } catch (error) {
        console.error('Error updating pinned achievements:', error);
        return NextResponse.json({ error: 'Failed to update pinned achievements' }, { status: 500 });
    }
}
