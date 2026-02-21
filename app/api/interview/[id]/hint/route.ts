import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { isValidObjectId } from '@/src/lib/db/mongoose';
import InterviewSession from '@/src/lib/db/models/InterviewSession';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';
import { evaluateStructure } from '@/src/lib/evaluation/structuralRules';
import { generateJSON } from '@/src/lib/ai/geminiClient';
import { ICanvasNode, IConnection } from '@/src/lib/db/models/Design';

interface RouteParams {
    params: Promise<{ id: string }>;
}

interface HintResponse {
    message: string;
    severity: 'question' | 'nudge' | 'praise';
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);
        if (!authenticatedUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        // Client can optionally pass a candidate reply to add to history
        const { nodes = [], connections = [], timeRemaining, candidateReply } = body;

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

        // If user sent a reply, push it to message log first
        if (candidateReply && candidateReply.trim() !== '') {
            session.aiMessages.push({
                role: 'candidate',
                content: candidateReply.trim(),
                timestamp: new Date()
            });
            // We save here in case the AI generation fails
            await session.save();
        }

        const structuralResults = evaluateStructure(
            nodes,
            connections,
            session.question.requirements || [],
            session.question.constraints || []
        );

        const formatNode = (n: ICanvasNode) => ({ type: n.type, label: n.label });
        const formatConn = (c: IConnection) => {
            const from = nodes.find((n: ICanvasNode) => n.id === c.from);
            const to = nodes.find((n: ICanvasNode) => n.id === c.to);
            return { fromType: from?.type, fromLabel: from?.label, toType: to?.type, toLabel: to?.label, label: c.label };
        };

        const failedRules = structuralResults.details.filter(d => d.status === 'fail').map(d => d.message);

        const prompt = `You are an expert systems design interviewer evaluating a candidate in a real-time system design interview. 

Question: ${session.question.prompt}

Current Canvas Nodes:
${JSON.stringify(nodes.map(formatNode), null, 2)}

Current Canvas Connections:
${JSON.stringify(connections.map(formatConn), null, 2)}

Current Structural Rule Failures:
${failedRules.length > 0 ? failedRules.join('\n') : 'None! Architecture looks structurally sound so far.'}

Time Remaining: ${timeRemaining || 'unknown'} minutes.

Conversation History (oldest to newest):
${session.aiMessages.length > 0
                ? session.aiMessages.map(m => `${m.role === 'interviewer' ? 'You' : 'Candidate'}: ${m.content}`).join('\n')
                : 'No messages yet.'}

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
            content: response.message,
            timestamp: new Date()
        };

        session.aiMessages.push(newMessage);
        await session.save();

        return NextResponse.json({
            success: true,
            hint: response,
            message: newMessage
        });
    } catch (error) {
        console.error('Error generating AI hint:', error);
        return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 });
    }
}
