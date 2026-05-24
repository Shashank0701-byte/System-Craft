import { NextResponse, NextRequest } from 'next/server';
import { withMetrics } from '@/src/lib/withMetrics';

export const GET = withMetrics('/api/health', async (req: NextRequest) => {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
});
