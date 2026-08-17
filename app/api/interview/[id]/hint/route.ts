import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { isValidObjectId } from '@/src/lib/db/mongoose';
import InterviewSession, { IConstraintChange } from '@/src/lib/db/models/InterviewSession';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';
import { evaluateStructure } from '@/src/lib/evaluation/structuralRules';
import { generateJSON } from '@/src/lib/ai/geminiClient';
import { ICanvasNode, IConnection } from '@/src/lib/db/models/Design';
import { checkRateLimit } from '@/src/lib/rateLimit';
import {
    resolveConstraintCanvas,
    shouldTriggerConstraintChange,
} from '@/src/lib/interview/constraintTrigger';

interface RouteParams {
    params: Promise<{ id: string }>;
}

interface HintResponse {
    message: string;
    severity: 'question' | 'nudge' | 'praise';
}

interface ConstraintCandidateContext {
    prompt: string;
    difficulty: 'easy' | 'medium' | 'hard';
    introducedAtMinute: number;
    nodes: ICanvasNode[];
    connections: IConnection[];
    failedRuleMessages: string[];
}

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

    const interviewerMessage = `Hold on — before we continue, a new constraint just hit: **${selected.title}**. ${selected.description} This is the top priority right now. Walk me through how you'd address this in your current design.`;

    return {
        id: `cc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...selected,
        introducedAt: new Date(),
        introducedAtMinute,
        status: 'active',
        interviewerMessage,
    };
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

        const {
            nodes: canvasNodes,
            connections: canvasConnections,
            nodeCount,
        } = resolveConstraintCanvas(nodes, connections, session.canvasSnapshot);

        const structuralResults = evaluateStructure(
            canvasNodes,
            canvasConnections,
            session.question.requirements || [],
            session.question.constraints || []
        );

        const failedRuleMessages = structuralResults.details
            .filter((detail) => detail.status === 'fail')
            .map((detail) => detail.message);

        const liveChangeDecision = shouldTriggerConstraintChange(session, nodeCount);

        if (liveChangeDecision.shouldTrigger) {
            const constraintChange = generateConstraintChange({
                prompt: session.question.prompt,
                difficulty: session.difficulty,
                introducedAtMinute: liveChangeDecision.introducedAtMinute,
                nodes: canvasNodes,
                connections: canvasConnections,
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
            const from = canvasNodes.find((n: ICanvasNode) => n.id === c.from);
            const to = canvasNodes.find((n: ICanvasNode) => n.id === c.to);
            return { fromType: from?.type, fromLabel: from?.label, toType: to?.type, toLabel: to?.label, label: c.label };
        };

        const failedRules = failedRuleMessages;

        const activeConstraints = session.constraintChanges.filter(
            (c) => c.status === 'active' || c.status === 'acknowledged'
        );
        const hasActiveConstraint = activeConstraints.length > 0;

        const prompt = `You are an expert systems design interviewer evaluating a candidate in a real-time system design interview.

Question: ${session.question.prompt}

Current Canvas Nodes:
${JSON.stringify(canvasNodes.map(formatNode), null, 2)}

Current Canvas Connections:
${JSON.stringify(canvasConnections.map(formatConn), null, 2)}

Current Structural Rule Failures:
${failedRules.length > 0 ? failedRules.join('\n') : 'None! Architecture looks structurally sound so far.'}

Time Remaining: ${timeRemaining || 'unknown'} minutes.

Live Constraint Changes:
${session.constraintChanges.length > 0
                ? session.constraintChanges.map(change => `- [${change.type}] ${change.title}: ${change.description} (status: ${change.status})`).join('\n')
                : 'None yet.'}

Conversation History (oldest to newest):
${session.aiMessages.length > 0
                ? session.aiMessages.map(m => `<${m.role === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}> ${sanitizeMessage(m.content)} </${m.role === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}>`).join('\n')
                : 'No messages yet.'}
${sanitizedCandidateReply ? `<CANDIDATE> ${sanitizedCandidateReply} </CANDIDATE>` : ''}

${hasActiveConstraint ? `IMPORTANT: There is an unresolved live constraint that the candidate has NOT yet addressed: ${activeConstraints.map(c => `"${c.title}" — ${c.description}`).join('; ')}. Your response MUST remind them to address this constraint. Do not praise unrelated work or move on to other topics until they acknowledge how they will handle it. Keep the pressure focused on this constraint.` : ''}

Generate a short, conversational response (1-2 sentences max) to send to the candidate right now. Do not be overly verbose. Act like a real interviewer guiding them.
- If there is an active unresolved constraint, your FIRST priority is reminding the candidate to address it.
- If the candidate just replied about the constraint, acknowledge it and probe deeper.
- If they are missing components unrelated to any active constraint, gently nudge them.
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
