import { NextRequest, NextResponse } from 'next/server';
import { llmRequestsTotal, llmRequestDuration } from '@/src/lib/metrics';
import { withMetrics } from '@/src/lib/withMetrics';
import { checkRateLimit } from '@/src/lib/rateLimit';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const UPSTREAM_TIMEOUT_MS = 60_000;
const LLM_MODEL = 'google/gemini-2.5-flash';

export const POST = withMetrics('/api/reference-architectures/quiz', async (req: NextRequest) => {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
  }

  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const { allowed, remaining, resetIn } = await checkRateLimit(ip, 'ai-quiz', 20, 3600);
  
  if (!allowed) {
    return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining), 'X-RateLimit-Reset': String(resetIn) } }
    );
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { title, analysis } = body;

    if (!title || typeof title !== 'string' || !analysis || typeof analysis !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid title or analysis data' }, { status: 400 });
    }

    const prompt = `You are a strict technical evaluator. Generate a 5-question multiple-choice quiz based on the following architecture analysis.
The questions should test the user's comprehension of the design decisions, data flow, failure modes, and scalability discussed in the text.

Architecture: ${title}

Analysis Text:
${analysis}

Return ONLY a valid JSON object with a single "questions" array. Each question MUST follow this exact structure:
{
  "questions": [
    {
      "question": "What is the primary database used for X?",
      "options": ["MySQL", "MongoDB", "Redis", "Cassandra"],
      "correctIndex": 2
    }
  ]
}
Do not include markdown blocks (\`\`\`json) around the response, just the raw JSON text.`;

    const upstreamAbort = new AbortController();
    const timeout = setTimeout(() => upstreamAbort.abort(), UPSTREAM_TIMEOUT_MS);
    const llmTimer = llmRequestDuration.startTimer({ model: LLM_MODEL });

    const onClientAbort = () => upstreamAbort.abort();
    req.signal.addEventListener('abort', onClientAbort);

    let response: Response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://systemcraft.app',
          'X-Title': 'SystemCraft',
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        }),
        signal: upstreamAbort.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      llmTimer();
      req.signal.removeEventListener('abort', onClientAbort);
      llmRequestsTotal.inc({ model: LLM_MODEL, status: 'error' });
      if ((fetchError as Error).name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out or was cancelled' }, { status: 504 });
      }
      throw fetchError;
    }

    clearTimeout(timeout);
    llmTimer();
    req.signal.removeEventListener('abort', onClientAbort);

    if (!response.ok) {
      llmRequestsTotal.inc({ model: LLM_MODEL, status: 'error' });
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ error: 'No content returned from AI' }, { status: 500 });
    }

    let parsedContent;
    try {
      // Clean up potential markdown formatting just in case
      let cleanContent = content.trim();
      if (cleanContent.startsWith('\`\`\`json')) {
        cleanContent = cleanContent.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
      }
      parsedContent = JSON.parse(cleanContent);
      
      if (!parsedContent || !Array.isArray(parsedContent.questions) || parsedContent.questions.length === 0) {
        throw new Error('Invalid LLM output schema');
      }
      for (const q of parsedContent.questions) {
        if (!q.question || !Array.isArray(q.options) || typeof q.correctIndex !== 'number') {
          throw new Error('Invalid question schema');
        }
      }
    } catch (e) {
      console.error('Failed to parse or validate AI response:', content, e);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    llmRequestsTotal.inc({ model: LLM_MODEL, status: 'success' });
    return NextResponse.json(parsedContent);

  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
