import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import User from '@/src/lib/db/models/User';
import InterviewSession from '@/src/lib/db/models/InterviewSession';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);

        if (!authenticatedUser) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid or missing token' },
                { status: 401 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch evaluated sessions, parsed directly by Mongoose
        const latestSessions = await InterviewSession.find({
            userId: user._id,
            status: 'evaluated',
        }).sort({ createdAt: -1 }).limit(50).lean();

        // Reverse to maintain chronological order
        const sessions = latestSessions.reverse();

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({
                totalInterviews: 0,
                averageScore: 0,
                bestScore: 0,
                scoreTrend: [],
                ruleHeatmap: [],
                weaknessFrequency: [],
                summaryStats: {
                    improvementPercent: 0,
                    mostCommonDifficulty: 'N/A',
                    avgTimeToSubmitMinutes: 0,
                },
            });
        }

        const totalInterviews = sessions.length;
        let totalScore = 0;
        let bestScore = 0;
        const scoreTrend: any[] = [];

        let totalTimeMinutes = 0;
        let validTimeSessionsCount = 0;
        const difficultyCounts: Record<string, number> = {};
        const weaknessCounts: Record<string, number> = {};

        // Heatmap for the last N interviews (up to 10 max)
        const recentSessions = sessions.slice(-10);

        const rulesEncountered = new Set<string>();
        const ruleHistory: Record<string, ('pass' | 'fail' | 'skip')[]> = {};

        sessions.forEach((session: any) => {
            const finalScore = session.evaluation?.finalScore ?? 0;
            totalScore += finalScore;
            if (finalScore > bestScore) bestScore = finalScore;

            const diff = (typeof session.difficulty === 'string' && session.difficulty.trim() !== '') ? session.difficulty.trim() : 'unknown';
            difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;

            if (session.startedAt && session.submittedAt) {
                const diffMs = new Date(session.submittedAt).getTime() - new Date(session.startedAt).getTime();
                totalTimeMinutes += diffMs / 60000;
                validTimeSessionsCount++;
            }

            // Score trend
            scoreTrend.push({
                date: new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                score: finalScore,
                difficulty: session.difficulty,
            });

            // Weakness extraction
            const weaknesses = session.evaluation?.reasoning?.weaknesses || [];
            weaknesses.forEach((w: string) => {
                // simple keyword extracting or clustering is hard here, so we will use the string directly or split key terms
                // We'll normalize to a lowercase token for frequency
                // A better approach in a real app is LLM normalization. Here we just take short phrases or full string
                let key = w;
                if (key.length > 50) key = key.substring(0, 47) + "...";
                weaknessCounts[key] = (weaknessCounts[key] || 0) + 1;
            });
        });

        recentSessions.forEach((session: any) => {
            const details = session.evaluation?.structural?.details || [];

            // Build rule heatmap array
            details.forEach((d: any) => {
                rulesEncountered.add(d.ruleId);
            });
        });

        // Initialize rule history
        rulesEncountered.forEach(ruleId => {
            ruleHistory[ruleId] = [];
        });

        recentSessions.forEach((session: any) => {
            const details = session.evaluation?.structural?.details || [];

            rulesEncountered.forEach(ruleId => {
                const spec = details.find((d: any) => d.ruleId === ruleId);
                ruleHistory[ruleId].push(spec ? (spec.passed ? 'pass' : 'fail') : 'skip');
            });
        });

        const ruleHeatmap = Array.from(rulesEncountered).map(ruleId => ({
            rule: ruleId,
            results: ruleHistory[ruleId]
        }));

        const averageScore = Math.round(totalScore / totalInterviews);

        let mostCommonDifficulty = 'N/A';
        let maxDifficultyCount = 0;
        Object.entries(difficultyCounts).forEach(([diff, count]) => {
            if (count > maxDifficultyCount) {
                maxDifficultyCount = count;
                mostCommonDifficulty = diff;
            }
        });

        const avgTimeToSubmitMinutes = validTimeSessionsCount > 0
            ? Math.round(totalTimeMinutes / validTimeSessionsCount)
            : 0;

        // Improvement %: Compare first session score with last session score to compute percentage improvement
        let improvementPercent = 0;
        if (totalInterviews > 1) {
            const firstScore = sessions[0].evaluation?.finalScore ?? 0;
            const lastScore = sessions[sessions.length - 1].evaluation?.finalScore ?? 0;
            if (firstScore > 0) {
                improvementPercent = Math.round(((lastScore - firstScore) / firstScore) * 100);
            }
        }

        const weaknessFrequency = Object.entries(weaknessCounts)
            .map(([weakness, count]) => ({ weakness, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // top 10

        return NextResponse.json({
            totalInterviews,
            averageScore,
            bestScore,
            scoreTrend,
            ruleHeatmap,
            weaknessFrequency,
            summaryStats: {
                improvementPercent,
                mostCommonDifficulty,
                avgTimeToSubmitMinutes,
            },
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
