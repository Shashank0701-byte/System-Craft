import { NextRequest, NextResponse } from 'next/server';
import { llmRequestsTotal, llmRequestDuration } from '@/src/lib/metrics';
import { withMetrics } from '@/src/lib/withMetrics';
import { checkRateLimit } from '@/src/lib/rateLimit';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const UPSTREAM_TIMEOUT_MS = 60_000; // 60s timeout for OpenRouter
const LLM_MODEL = 'google/gemini-2.0-flash-001';

export const POST = withMetrics('/api/reference-architectures/analyze', async (req: NextRequest) => {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
  }

  // Rate limit by IP since this endpoint doesn't require Firebase auth
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { allowed, remaining, resetIn } = await checkRateLimit(ip, 'ai-analyze', 20, 3600);
  if (!allowed) {
    return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining), 'X-RateLimit-Reset': String(resetIn) } }
    );
  }

  try {
    const { title, company, description, tags, nodes, connections, annotations } = await req.json();

    if (!title || !nodes || !connections) {
      return NextResponse.json({ error: 'Missing architecture data' }, { status: 400 });
    }

    if (!Array.isArray(nodes) || !Array.isArray(connections)) {
      return NextResponse.json({ error: 'Malformed nodes or connections — expected arrays' }, { status: 400 });
    }

    // Build a compact text representation of the architecture
    const nodeList = nodes
      .map((n: { type: string; label?: string }) => `${n.label || n.type} (${n.type})`)
      .join(', ');

    const connList = connections
      .map((c: { from: string; to: string; label?: string }) => {
        const fromNode = nodes.find((n: { id: string }) => n.id === c.from);
        const toNode = nodes.find((n: { id: string }) => n.id === c.to);
        const fromLabel = fromNode?.label || fromNode?.type || c.from;
        const toLabel = toNode?.label || toNode?.type || c.to;
        return `${fromLabel} → ${toLabel}${c.label ? ` (${c.label})` : ''}`;
      })
      .join('\n');

    const annotationText = annotations
      ?.map((a: { title: string; body: string }) => `${a.title}: ${a.body}`)
      .join('\n') || '';

    const prompt = `You are a senior system design expert. Analyze this architecture concisely.

Architecture: ${title} (${company})
${description}

Key Concepts: ${tags?.join(', ') || 'N/A'}

Components: ${nodeList}

Connections:
${connList}

Design Notes:
${annotationText}

---

Write a focused analysis in Markdown with these exact sections. Use ### for headings. No emojis. Be specific — reference component names from the diagram. Use short bullet points, not long paragraphs.

### Data Flow
Walk through the primary request path step-by-step in 4-6 bullet points.

### Key Design Decisions
3 decisions visible in this architecture. One sentence each on why + one on the alternative.

### Scalability
How each tier scales horizontally. 3-4 bullet points max.

### Trade-offs
2-3 inherent trade-offs (CAP, latency vs throughput, etc). Keep each to 1-2 sentences.

### Failure Modes
3 critical failure scenarios and how the system degrades. Bullet points only.

### Interview Tips
5 concise talking points a candidate must cover.

Keep the entire response under 600 words. Be dense and precise.`;

    // Abort controller that races client disconnect and a hard timeout
    const upstreamAbort = new AbortController();
    const timeout = setTimeout(() => upstreamAbort.abort(), UPSTREAM_TIMEOUT_MS);
    const llmTimer = llmRequestDuration.startTimer({ model: LLM_MODEL });

    // Forward client abort to upstream
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
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
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

    if (!response.ok) {
      clearTimeout(timeout);
      llmTimer();
      req.signal.removeEventListener('abort', onClientAbort);
      llmRequestsTotal.inc({ model: LLM_MODEL, status: 'error' });
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    // Stream the response back to the client with carry-over buffer
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n');

            // Last element may be an incomplete line — keep it in the buffer
            buffer = parts.pop() || '';

            for (const line of parts) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;

              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') {
                buffer = '';
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch {
                // skip malformed JSON chunks
              }
            }
          }

          // Process any remaining buffer content
          if (buffer.trim().startsWith('data: ')) {
            const data = buffer.trim().slice(6).trim();
            if (data && data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch {
                // skip
              }
            }
          }
        } finally {
          clearTimeout(timeout);
          llmTimer();
          llmRequestsTotal.inc({ model: LLM_MODEL, status: 'success' });
          req.signal.removeEventListener('abort', onClientAbort);
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
