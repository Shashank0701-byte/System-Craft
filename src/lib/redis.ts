import Redis from 'ioredis';

// Add redis cache to global to prevent multiple connections in dev
declare global {
    var redisCache: Redis | null;
}

// Graceful fallback if REDIS_URL is missing
const REDIS_URL = process.env.REDIS_URL;

let redisClient: Redis | null = null;

if (REDIS_URL) {
    if (process.env.NODE_ENV === 'development') {
        if (!global.redisCache) {
            global.redisCache = new Redis(REDIS_URL, {
                lazyConnect: true, // Don't crash on startup if Redis is down
                maxRetriesPerRequest: 3,
                retryStrategy(times) {
                    // Exponential backoff with a max of 3 seconds
                    return Math.min(times * 50, 3000);
                },
            });
        }
        redisClient = global.redisCache;
    } else {
        redisClient = new Redis(REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                return Math.min(times * 50, 3000);
            },
        });
    }

    // Suppress unhandled error crashes in production if Redis drops connection
    redisClient.on('error', (err) => {
        console.warn('Redis Client Error:', err.message);
    });
} else {
    console.warn('REDIS_URL is not set. Application will run without caching/rate-limiting (fail-open).');
}

/**
 * Get the Redis client. May return null if Redis is not configured or unavailable.
 * Always null-check before using.
 */
export function getRedisClient(): Redis | null {
    return redisClient;
}
