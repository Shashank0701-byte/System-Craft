import { NextResponse } from 'next/server';
import { register } from '@/src/lib/metrics';

/**
 * GET /api/metrics
 * Returns Prometheus-format text metrics for scraping.
 * Blocked externally by Nginx — only Prometheus (on the Docker network) can reach it.
 */
export async function GET() {
  try {
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to collect metrics:', error);
    return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 });
  }
}
