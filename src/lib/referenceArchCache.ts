import { getRedisClient } from './redis';
import { REFERENCE_ARCHITECTURES } from './referenceArchitectures';

const CACHE_TTL_SECONDS = 3600; // 1 hour

/**
 * Retrieves a reference architecture by its ID.
 * Tries to fetch from Redis cache first. If it's a cache miss, loads from
 * the static list (or database in the future), caches it, and returns it.
 */
export async function getCachedArchitecture(id: string) {
    const redis = getRedisClient();
    const cacheKey = `ref-arch:${id}`;

    // 1. Try Cache
    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error(`Failed to read from Redis for key ${cacheKey}:`, error);
            // Fall through to fetch from source
        }
    }

    // 2. Cache Miss: Fetch from Source
    const architecture = REFERENCE_ARCHITECTURES.find(a => a.id === id);
    if (!architecture) {
        return null; // Not found
    }

    // 3. Update Cache
    if (redis) {
        try {
            await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(architecture));
        } catch (error) {
            console.error(`Failed to write to Redis for key ${cacheKey}:`, error);
            // Fail open: just return the data without crashing
        }
    }

    return architecture;
}

/**
 * Retrieves all reference architectures.
 * Caches the entire list to avoid repeated database queries in the future.
 */
export async function getCachedAllArchitectures() {
    const redis = getRedisClient();
    const cacheKey = `ref-arch:all`;

    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error(`Failed to read from Redis for key ${cacheKey}:`, error);
        }
    }

    const architectures = REFERENCE_ARCHITECTURES;

    if (redis) {
        try {
            await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(architectures));
        } catch (error) {
            console.error(`Failed to write to Redis for key ${cacheKey}:`, error);
        }
    }

    return architectures;
}
