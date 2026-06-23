import { getRedisClient } from './redis';

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

/**
 * Checks if an action is allowed under the current rate limit using a sliding window approach
 * backed by Redis INCR and EXPIRE.
 *
 * If Redis is unavailable, this defaults to fail-open (allows all requests) to prevent
 * taking down the application due to a cache outage.
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

    // Fail-open if Redis is not configured or down
    if (!redis) {
        return { allowed: true, remaining: limit, resetIn: 0 };
    }

    // Bucket by current time window (e.g., current hour if windowSeconds is 3600)
    const currentWindow = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `ratelimit:${action}:${identifier}:${currentWindow}`;

    try {
        // Use a pipeline to execute INCR and EXPIRE atomically
        const pipeline = redis.pipeline();
        pipeline.incr(key);
        // Only set expire if it's a new key, or just reset the expire every time
        // Setting it every time is safer to ensure it cleans up
        pipeline.expire(key, windowSeconds);

        const results = await pipeline.exec();
        if (!results) {
            return { allowed: true, remaining: limit, resetIn: 0 };
        }

        // results[0] is the result of incr
        const countError = results[0][0];
        const currentCount = results[0][1] as number;

        if (countError) {
            console.error('Redis INCR failed in rate limit:', countError);
            return { allowed: true, remaining: limit, resetIn: 0 };
        }

        const allowed = currentCount <= limit;
        const remaining = Math.max(0, limit - currentCount);
        
        // Calculate reset time based on the end of the current window
        const nextWindowStart = (currentWindow + 1) * windowSeconds;
        const resetIn = Math.max(0, nextWindowStart - Math.floor(Date.now() / 1000));

        return { allowed, remaining, resetIn };
    } catch (error) {
        // Fail-open on network errors
        console.error('Rate limit error, failing open:', error);
        return { allowed: true, remaining: limit, resetIn: 0 };
    }
}
