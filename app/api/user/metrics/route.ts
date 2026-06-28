import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import User from '@/src/lib/db/models/User';
import UserMetrics from '@/src/lib/achievements/metrics';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';
import { getLevelFromXP, getXPProgressInLevel, LEVELS } from '@/src/lib/achievements/xp';

// GET /api/user/metrics — XP, level, streaks, heatmap, skill breakdown
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

        const metrics = await UserMetrics.findOne({ userId: user._id }).lean();

        if (!metrics) {
            // Return zeroed-out state for new users
            return NextResponse.json({
                xp: { total: 0, level: 1, title: 'Student', progress: { current: 0, required: 500, percent: 0 } },
                streaks: { current: 0, longest: 0, lastActivityDate: null },
                heatmap: {},
                skills: buildSkillBreakdown(null),
                pinnedAchievements: [],
                levels: LEVELS,
            });
        }

        const totalXP = metrics.totalXP ?? 0;
        const levelInfo = getLevelFromXP(totalXP);
        const xpProgress = getXPProgressInLevel(totalXP);

        return NextResponse.json({
            xp: {
                total: totalXP,
                level: levelInfo.level,
                title: levelInfo.title,
                progress: xpProgress,
            },
            streaks: {
                current: metrics.currentStreak ?? 0,
                longest: metrics.longestStreak ?? 0,
                lastActivityDate: metrics.lastActivityDate ?? null,
            },
            heatmap: Object.fromEntries(metrics.activityHeatmap ?? new Map()),
            skills: buildSkillBreakdown(metrics),
            pinnedAchievements: metrics.pinnedAchievements ?? [],
            levels: LEVELS,
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}

// ─── Skill Breakdown ─────────────────────────────────────────────────────────

interface SkillScore {
  name: string;
  score: number; // 0–100
  icon: string;
}

function buildSkillBreakdown(metrics: import('@/src/lib/achievements/metrics').IUserMetricsData | null): SkillScore[] {
  const cap = (val: number, max: number) => Math.min(100, Math.round((val / max) * 100));
  const m = metrics ?? {};

  return [
    {
      name: 'Caching',
      icon: 'memory',
      score: cap((m as { cacheImplementations?: number }).cacheImplementations ?? 0, 150),
    },
    {
      name: 'Load Balancing',
      icon: 'balance',
      score: cap((m as { loadBalancerImplementations?: number }).loadBalancerImplementations ?? 0, 150),
    },
    {
      name: 'Databases',
      icon: 'storage',
      score: cap((m as { databaseImplementations?: number }).databaseImplementations ?? 0, 150),
    },
    {
      name: 'Messaging',
      icon: 'forum',
      score: cap((m as { messagingImplementations?: number }).messagingImplementations ?? 0, 80),
    },
    {
      name: 'Networking',
      icon: 'language',
      score: cap(
        ((m as { cdnImplementations?: number }).cdnImplementations ?? 0) +
          ((m as { apiGatewayImplementations?: number }).apiGatewayImplementations ?? 0),
        100
      ),
    },
    {
      name: 'Reliability',
      icon: 'health_and_safety',
      score: cap(
        ((m as { faultToleranceImplementations?: number }).faultToleranceImplementations ?? 0) +
          ((m as { highAvailabilityDesigns?: number }).highAvailabilityDesigns ?? 0),
        50
      ),
    },
    {
      name: 'Scalability',
      icon: 'open_in_full',
      score: cap((m as { simulationsExecuted?: number }).simulationsExecuted ?? 0, 50),
    },
    {
      name: 'Distributed Systems',
      icon: 'device_hub',
      score: cap(
        ((m as { shardingApplications?: number }).shardingApplications ?? 0) +
          ((m as { replicationApplications?: number }).replicationApplications ?? 0) +
          ((m as { capTheoremApplications?: number }).capTheoremApplications ?? 0),
        75
      ),
    },
  ];
}
