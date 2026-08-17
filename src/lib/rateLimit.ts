import { getRedisClient } from './redis';

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

// In-memory fallback used when Redis is unavailable.
// Keeps limits enforced during outages instead of failing open.
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function memoryRateLimit(key: string, limit: number, resetIn: number): RateLimitResult {
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || entry.expiresAt < now) {
        memoryStore.set(key, { count: 1, expiresAt: now + resetIn * 1000 });
        return { allowed: true, remaining: limit - 1, resetIn };
    }

    entry.count += 1;
    const allowed = entry.count <= limit;
    const remaining = Math.max(0, limit - entry.count);
    const timeLeft = Math.ceil((entry.expiresAt - now) / 1000);
    return { allowed, remaining, resetIn: timeLeft };
}

/**
 * Checks if an action is allowed under the current rate limit using a sliding window approach
 * backed by Redis INCR and EXPIRE.
 *
 * If Redis is unavailable, falls back to an in-memory limiter so limits are still enforced.
 *
 * @param identifier Unique ID for the user (e.g. user ID or IP address)
 * @param action Name of the action (e.g. 'ai-generation')
 * @param limit Maximum number of requests allowed in the window
 * @param windowSeconds Duration of the window in seconds (e.g. 3600 for 1 hour)
 */
export async function checkRateLimit(
    identifier: string,
    action: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const redis = getRedisClient();

    // Bucket by current time window (e.g., current hour if windowSeconds is 3600)
    const currentWindow = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `ratelimit:${action}:${identifier}:${currentWindow}`;

    // Calculate reset time based on the end of the current window
    const nextWindowStart = (currentWindow + 1) * windowSeconds;
    const resetIn = Math.max(0, nextWindowStart - Math.floor(Date.now() / 1000));

    if (!redis) {
        console.warn('[RateLimit] Redis unavailable — using in-memory fallback limiter');
        return memoryRateLimit(key, limit, resetIn);
    }

    try {
        // Use a pipeline to execute INCR and EXPIRE atomically
        const pipeline = redis.pipeline();
        pipeline.incr(key);
        // Setting expire every time is safer to ensure cleanup
        pipeline.expire(key, resetIn);

        const results = await pipeline.exec();
        if (!results) {
            console.warn('[RateLimit] Redis pipeline returned null — using in-memory fallback');
            return memoryRateLimit(key, limit, resetIn);
        }

        // results[0] is the result of incr
        const countError = results[0][0];
        const currentCount = results[0][1] as number;

        if (countError) {
            console.error('[RateLimit] Redis INCR failed — using in-memory fallback:', countError);
            return memoryRateLimit(key, limit, resetIn);
        }

        const allowed = currentCount <= limit;
        const remaining = Math.max(0, limit - currentCount);

        return { allowed, remaining, resetIn };
    } catch (error) {
        console.error('[RateLimit] Redis error — using in-memory fallback:', error);
        return memoryRateLimit(key, limit, resetIn);
    }
}
