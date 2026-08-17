import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import User from '@/src/lib/db/models/User';
import InterviewSession, { IConstraintChange, IRuleResult } from '@/src/lib/db/models/InterviewSession';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

interface LeanSession {
    difficulty?: string;
    evaluation?: {
        finalScore?: number;
        structural?: { details?: IRuleResult[] };
        reasoning?: { score?: number; strengths?: string[]; weaknesses?: string[] };
    };
    constraintChanges?: IConstraintChange[];
}

// Map structural rule descriptions → radar dimensions
const RULE_TO_DIMENSION: Record<string, string> = {
    'Design includes a Load Balancer': 'Scalability',
    'Load Balancer connects to Servers': 'Scalability',
    'Design includes Application Servers': 'Scalability',
    'Design includes a Database': 'Reliability',
    'Servers connect to Database': 'Reliability',
    'All components are connected': 'Reliability',
    'Includes Caching for performance': 'Latency',
    'Uses Queues for async tasks': 'Async Design',
};

const DIMENSIONS = ['Scalability', 'Reliability', 'Latency', 'Async Design', 'Adaptability', 'Depth'];

function getLevel(avgScore: number, totalInterviews: number): { label: string; color: string } {
    if (avgScore >= 85 && totalInterviews >= 5) return { label: 'Expert', color: '#a78bfa' };
    if (avgScore >= 70 && totalInterviews >= 3) return { label: 'Advanced', color: '#60a5fa' };
    if (avgScore >= 50) return { label: 'Intermediate', color: '#34d399' };
    return { label: 'Beginner', color: '#94a3b8' };
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);
        if (!authenticatedUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const sessions = (await InterviewSession.find({
            userId: user._id,
            status: 'evaluated',
        }).sort({ createdAt: -1 }).limit(50).lean()).reverse();

        if (sessions.length < 3) {
            return NextResponse.json({ error: 'Need at least 3 evaluated interviews', code: 'INSUFFICIENT_DATA' }, { status: 400 });
        }

        // --- Basic stats ---
        const totalInterviews = sessions.length;
        const typedSessions = sessions as LeanSession[];
        const scores = typedSessions.map((s) => s.evaluation?.finalScore ?? 0);
        const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const bestScore = Math.max(...scores);

        // Score trend (last 8)
        const scoreTrend = typedSessions.slice(-8).map((s) => ({
            score: s.evaluation?.finalScore ?? 0,
            difficulty: s.difficulty,
        }));

        // Improvement
        const improvementPercent = scores.length > 1 && scores[0] > 0
            ? Math.round(((scores[scores.length - 1] - scores[0]) / scores[0]) * 100)
            : 0;

        // Difficulty breakdown
        const difficultyCounts: Record<string, number> = {};
        typedSessions.forEach((s) => {
            const d = s.difficulty || 'unknown';
            difficultyCounts[d] = (difficultyCounts[d] || 0) + 1;
        });

        // --- Radar dimensions ---
        const dimensionPass: Record<string, number> = {};
        const dimensionTotal: Record<string, number> = {};
        DIMENSIONS.forEach(d => { dimensionPass[d] = 0; dimensionTotal[d] = 0; });

        // Adaptability from constraint changes
        let adaptabilityScore = 0;
        let adaptabilityCount = 0;

        typedSessions.forEach((s) => {
            const details: IRuleResult[] = s.evaluation?.structural?.details || [];
            details.forEach((rule) => {
                const dim = RULE_TO_DIMENSION[rule.rule];
                if (dim) {
                    dimensionTotal[dim]++;
                    if (rule.status === 'pass') dimensionPass[dim]++;
                }
            });

            // Depth from reasoning score
            const reasoningScore = s.evaluation?.reasoning?.score ?? 0;
            dimensionPass['Depth'] += reasoningScore;
            dimensionTotal['Depth']++;

            // Adaptability from constraint changes addressed
            const changes: IConstraintChange[] = s.constraintChanges || [];
            if (changes.length > 0) {
                const addressed = changes.filter((c) => c.status === 'addressed' && !c.failedAt).length;
                adaptabilityScore += addressed / changes.length;
                adaptabilityCount++;
            }
        });

        const radarData = DIMENSIONS.map(dim => {
            let score = 0;
            if (dim === 'Depth') {
                score = dimensionTotal[dim] > 0
                    ? Math.round(dimensionPass[dim] / dimensionTotal[dim])
                    : 50;
            } else if (dim === 'Adaptability') {
                score = adaptabilityCount > 0
                    ? Math.round((adaptabilityScore / adaptabilityCount) * 100)
                    : Math.round(averageScore * 0.9);
            } else {
                score = dimensionTotal[dim] > 0
                    ? Math.round((dimensionPass[dim] / dimensionTotal[dim]) * 100)
                    : 50;
            }
            return { dimension: dim, score };
        });

        // --- Strengths & weaknesses ---
        const weaknessCounts: Record<string, number> = {};
        const strengthCounts: Record<string, number> = {};
        typedSessions.forEach((s) => {
            (s.evaluation?.reasoning?.weaknesses || []).forEach((w: string) => {
                const key = w.length > 60 ? w.substring(0, 57) + '...' : w;
                weaknessCounts[key] = (weaknessCounts[key] || 0) + 1;
            });
            (s.evaluation?.reasoning?.strengths || []).forEach((st: string) => {
                const key = st.length > 60 ? st.substring(0, 57) + '...' : st;
                strengthCounts[key] = (strengthCounts[key] || 0) + 1;
            });
        });

        const topStrength = Object.entries(strengthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const topWeakness = Object.entries(weaknessCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        const level = getLevel(averageScore, totalInterviews);

        return NextResponse.json({
            displayName: user.displayName || 'Engineer',
            totalInterviews,
            averageScore,
            bestScore,
            improvementPercent,
            scoreTrend,
            radarData,
            difficultyCounts,
            topStrength,
            topWeakness,
            level,
        });
    } catch (err) {
        console.error('Report card error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
