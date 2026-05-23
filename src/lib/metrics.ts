import client from 'prom-client';

// ── Singleton registry ──────────────────────────────────────────────
// prom-client uses a global default registry. We configure it once and
// re-export the metrics so every API route imports from a single source.

const register = client.register;

// Prevent double-registration in Next.js dev mode (hot-reload)
const isInitialised = (globalThis as Record<string, unknown>).__metricsInit;

if (!isInitialised) {
  // Collect default Node.js metrics (GC, heap, event loop, active handles)
  client.collectDefaultMetrics({ register });
  (globalThis as Record<string, unknown>).__metricsInit = true;
}

// ── HTTP metrics ────────────────────────────────────────────────────

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// ── LLM / AI metrics ───────────────────────────────────────────────

export const llmRequestsTotal = new client.Counter({
  name: 'llm_requests_total',
  help: 'Total LLM API calls to OpenRouter',
  labelNames: ['model', 'status'] as const,
  registers: [register],
});

export const llmRequestDuration = new client.Histogram({
  name: 'llm_request_duration_seconds',
  help: 'LLM request round-trip duration in seconds',
  labelNames: ['model'] as const,
  buckets: [0.5, 1, 2.5, 5, 10, 20, 30, 60],
  registers: [register],
});

export const llmTokensTotal = new client.Counter({
  name: 'llm_tokens_total',
  help: 'Total LLM tokens consumed',
  labelNames: ['model', 'type'] as const,  // type: prompt | completion
  registers: [register],
});

// ── Export ───────────────────────────────────────────────────────────

export { register };
