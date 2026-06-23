import { NextResponse } from 'next/server';
import { withMetrics } from '@/src/lib/withMetrics';
import { getRedisClient } from '@/src/lib/redis';

export const GET = withMetrics('/api/health', async () => {
  const redisClient = getRedisClient();
  const redisOk = redisClient ? await redisClient.ping().then(() => true).catch(() => false) : false;
  
  return NextResponse.json({ 
    status: 'ok',
    redis: redisOk ? 'connected' : 'disconnected'
  }, { status: 200 });
});
