import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { isValidObjectId } from '@/src/lib/db/mongoose';
import InterviewSession from '@/src/lib/db/models/InterviewSession';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';
import { evaluateStructure } from '@/src/lib/evaluation/structuralRules';
import { generateJSON } from '@/src/lib/ai/geminiClient';
import { ICanvasNode, IConnection } from '@/src/lib/db/models/Design';
import { IConstraintChange } from '@/src/lib/db/models/InterviewSession';
import { checkRateLimit } from '@/src/lib/rateLimit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

interface HintResponse {
    message: string;
    severity: 'question' | 'nudge' | 'praise';
}

interface ConstraintTriggerSession {
    difficulty: 'easy' | 'medium' | 'hard';
    constraintChanges?: IConstraintChange[];
    startedAt: Date | string;
    timeLimit: number;
}

interface ConstraintCandidateContext {
    prompt: string;
    difficulty: 'easy' | 'medium' | 'hard';
    introducedAtMinute: number;
    nodes: ICanvasNode[];
    connections: IConnection[];
    failedRuleMessages: string[];
}

const LIVE_CHANGE_MIN_PROGRESS = 0.25;
const LIVE_CHANGE_MAX_PROGRESS = 0.75;
const LIVE_CHANGE_MIN_NODES = 3;

function generateConstraintChange(
    {
        prompt,
        difficulty,
        introducedAtMinute,
        nodes,
        connections,
        failedRuleMessages
    }: ConstraintCandidateContext
): IConstraintChange {
    const lowerPrompt = prompt.toLowerCase();
    const nodeTypes = new Set(nodes.map((node) => node.type));
    const connectionCount = connections.length;
    const hasCache = nodeTypes.has('Cache') || nodeTypes.has('CDN');
    const hasQueue = nodeTypes.has('Queue') || nodeTypes.has('Kafka');
    const databaseCount = nodes.filter((node) => node.type === 'SQL' || node.type === 'Blob').length;
    const hasRealtimePrompt = ['chat', 'notification', 'feed', 'stream', 'collaborative'].some((keyword) => lowerPrompt.includes(keyword));
    const hasFinancialPrompt = ['payment', 'trade', 'order'].some((keyword) => lowerPrompt.includes(keyword));
    const mentionsDisconnected = failedRuleMessages.some((message) => message.toLowerCase().includes('not connected') || message.toLowerCase().includes('floating'));

    let selected: Omit<IConstraintChange, 'id' | 'introducedAt' | 'introducedAtMinute' | 'status' | 'interviewerMessage'>;

    if (!hasCache && (hasRealtimePrompt || nodeTypes.has('LB') || connectionCount >= 3)) {
        selected = {
            type: 'traffic',
            title: 'Traffic Spike',
            description: 'Peak traffic is now expected to spike to roughly 10x the original estimate during major live events.',
            severity: 'high',
            impactAreas: ['scalability', 'caching', 'load balancing'],
        };
    } else if ((databaseCount <= 1 || mentionsDisconnected) && difficulty !== 'easy') {
        const candidateNodes = nodes.filter((n) => ['SQL', 'Blob', 'Cache', 'Server', 'LB', 'Queue', 'Kafka', 'Function', 'CDN'].includes(n.type));
        const victim = candidateNodes.length > 0 ? candidateNodes[Math.floor(Math.random() * candidateNodes.length)] : undefined;
        selected = {
            type: 'reliability',
            title: 'Node Failure',
            description: victim ? `The ${victim.label || victim.type} component just went offline unexpectedly. The system must continue serving users with minimal disruption.` : 'The system must continue serving users during a full regional outage with minimal disruption.',
            severity: difficulty === 'hard' ? 'high' : 'moderate',
            impactAreas: ['availability', 'replication', 'disaster recovery'],
            impactedNodeId: victim?.id,
        };
    } else if (!hasQueue && (hasRealtimePrompt || nodeTypes.has('Server') || nodeTypes.has('Function'))) {
        selected = {
            type: 'product',
            title: 'Real-Time Updates',
            description: 'Users now expect live updates in the product instead of relying on manual refreshes or long polling.',
            severity: 'moderate',
            impactAreas: ['realtime', 'messaging', 'fan-out'],
        };
    } else if (hasFinancialPrompt) {
        selected = {
            type: 'latency',
            title: 'Stricter Write Latency',
            description: 'Critical write operations now need to complete within 150ms at p95 while preserving correctness.',
            severity: 'high',
            impactAreas: ['latency', 'consistency', 'storage'],
        };
    } else {
        selected = {
            type: 'compliance',
            title: 'Regional Data Residency',
            description: 'Data for EU users must remain in-region and cannot be freely replicated across all geographies.',
            severity: 'moderate',
            impactAreas: ['compliance', 'storage', 'multi-region'],
        };
    }

    const interviewerMessage = `Let's add a new constraint: ${selected.description} How would you adjust your design to handle that?`;

    return {
        id: `cc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...selected,
        introducedAt: new Date(),
        introducedAtMinute,
        status: 'active',
        interviewerMessage,
    };
}

function shouldTriggerConstraintChange(
    session: ConstraintTriggerSession,
    nodeCount: number
): { shouldTrigger: boolean; introducedAtMinute: number } {
    if (!['medium', 'hard'].includes(session.difficulty)) {
        return { shouldTrigger: false, introducedAtMinute: 0 };
    }

    if ((session.constraintChanges || []).length > 0) {
        return { shouldTrigger: false, introducedAtMinute: 0 };
    }

    if (nodeCount < LIVE_CHANGE_MIN_NODES) {
        return { shouldTrigger: false, introducedAtMinute: 0 };
    }

    const startedAt = new Date(session.startedAt).getTime();
    if (isNaN(startedAt)) {
        return { shouldTrigger: false, introducedAtMinute: 0 };
    }

    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - startedAt) / (1000 * 60)));
    const progress = session.timeLimit > 0 ? elapsedMinutes / session.timeLimit : 0;

    if (progress < LIVE_CHANGE_MIN_PROGRESS || progress > LIVE_CHANGE_MAX_PROGRESS) {
        return { shouldTrigger: false, introducedAtMinute: elapsedMinutes };
    }

    return { shouldTrigger: true, introducedAtMinute: elapsedMinutes };
}

export const POST = async (request: NextRequest, { params }: RouteParams) => {
    try {
        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);
        if (!authenticatedUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { allowed, remaining, resetIn } = await checkRateLimit(authenticatedUser.uid, 'ai-hint', 20, 3600);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Try again later.' },
                { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining), 'X-RateLimit-Reset': String(resetIn) } }
            );
        }

        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        // Client can optionally pass a candidate reply to add to history
        const { nodes = [], connections = [], timeRemaining, candidateReply } = body;

        if (!Array.isArray(nodes) || !Array.isArray(connections)) {
            return NextResponse.json({ error: 'nodes and connections must be arrays' }, { status: 400 });
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
        if (session.status !== 'in_progress') {
            return NextResponse.json({ error: 'Session is no longer in progress' }, { status: 400 });
        }

        if (!session.aiMessages) {
            session.aiMessages = [];
        }
        if (!session.constraintChanges) {
            session.constraintChanges = [];
        }

        const sanitizeMessage = (msg: string) => {
            if (!msg) return '';
            return String(msg)
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                .slice(0, 1500);
        };

        const sanitizedCandidateReply = candidateReply && candidateReply.trim() !== ''
            ? sanitizeMessage(candidateReply.trim())
            : null;

        const structuralResults = evaluateStructure(
            nodes,
            connections,
            session.question.requirements || [],
            session.question.constraints || []
        );

        const failedRuleMessages = structuralResults.details
            .filter((detail) => detail.status === 'fail')
            .map((detail) => detail.message);

        const liveChangeDecision = shouldTriggerConstraintChange(session, nodes.length);

        if (liveChangeDecision.shouldTrigger) {
            const constraintChange = generateConstraintChange({
                prompt: session.question.prompt,
                difficulty: session.difficulty,
                introducedAtMinute: liveChangeDecision.introducedAtMinute,
                nodes,
                connections,
                failedRuleMessages
            });

            const newMessage = {
                role: 'interviewer' as const,
                content: constraintChange.interviewerMessage,
                timestamp: new Date()
            };

            if (sanitizedCandidateReply) {
                session.aiMessages.push({
                    role: 'candidate',
                    content: sanitizedCandidateReply,
                    timestamp: new Date()
                });
            }

            session.constraintChanges.push(constraintChange);
            session.aiMessages.push(newMessage);
            await session.save();

            return NextResponse.json({
                success: true,
                hint: {
                    message: newMessage.content,
                    severity: 'question'
                },
                message: newMessage,
                constraintChange
            });
        }

        const formatNode = (n: ICanvasNode) => ({ type: n.type, label: n.label });
        const formatConn = (c: IConnection) => {
            const from = nodes.find((n: ICanvasNode) => n.id === c.from);
            const to = nodes.find((n: ICanvasNode) => n.id === c.to);
            return { fromType: from?.type, fromLabel: from?.label, toType: to?.type, toLabel: to?.label, label: c.label };
        };

        const failedRules = failedRuleMessages;

        const prompt = `You are an expert systems design interviewer evaluating a candidate in a real-time system design interview. 

Question: ${session.question.prompt}

Current Canvas Nodes:
${JSON.stringify(nodes.map(formatNode), null, 2)}

Current Canvas Connections:
${JSON.stringify(connections.map(formatConn), null, 2)}

Current Structural Rule Failures:
${failedRules.length > 0 ? failedRules.join('\n') : 'None! Architecture looks structurally sound so far.'}

Time Remaining: ${timeRemaining || 'unknown'} minutes.

Live Constraint Changes:
${session.constraintChanges.length > 0
                ? session.constraintChanges.map(change => `- [${change.type}] ${change.title}: ${change.description}`).join('\n')
                : 'None yet.'}

Conversation History (oldest to newest):
${session.aiMessages.length > 0
                ? session.aiMessages.map(m => `<${m.role === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}> ${sanitizeMessage(m.content)} </${m.role === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}>`).join('\n')
                : 'No messages yet.'}
${sanitizedCandidateReply ? `<CANDIDATE> ${sanitizedCandidateReply} </CANDIDATE>` : ''}

Generate a short, conversational response (1-2 sentences max) to send to the candidate right now. Do not be overly verbose. Act like a real interviewer guiding them.
- If the candidate just replied, acknowledge their point or ask a follow-up.
- If they are missing components, gently nudge them ("How will you handle caching?").
- Ask 'question' severity for probing questions, 'nudge' for hints/corrections, or 'praise' for good choices.

Respond strictly in JSON:
{ 
  "message": "...", 
  "severity": "question" | "nudge" | "praise" 
}`;

        const response = await generateJSON<HintResponse>(prompt);

        const newMessage = {
            role: 'interviewer' as const,
            content: sanitizeMessage(response?.message || "I'm here to help. Could you elaborate on your current architecture?"),
            timestamp: new Date()
        };

        if (sanitizedCandidateReply) {
            session.aiMessages.push({
                role: 'candidate',
                content: sanitizedCandidateReply,
                timestamp: new Date()
            });
        }

        session.aiMessages.push(newMessage);
        await session.save();

        return NextResponse.json({
            success: true,
            hint: response,
            message: newMessage,
            constraintChange: null
        });
    } catch (error) {
        console.error('Error generating AI hint:', error);
        return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 });
    }
}
