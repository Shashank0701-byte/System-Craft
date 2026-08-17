import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit } from './rateLimit';
import { getRedisClient } from './redis';

// Mock the redis module
vi.mock('./redis', () => ({
    getRedisClient: vi.fn(),
}));

describe('checkRateLimit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset time to a predictable value for tests
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('falls back to in-memory limiter if Redis is unavailable', async () => {
        vi.mocked(getRedisClient).mockReturnValue(null);

        const result = await checkRateLimit('user1', 'action', 5, 60);

        // In-memory fallback counts the request (limit - 1 remaining) and
        // uses the current window's remaining seconds as resetIn.
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
        expect(result.resetIn).toBe(60);
    });

    it('allows request when under the limit', async () => {
        const mockPipeline = {
            incr: vi.fn().mockReturnThis(),
            expire: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue([[null, 1]]), // 1st request
        };
        const mockRedis = {
            pipeline: vi.fn().mockReturnValue(mockPipeline),
        } as unknown as Exclude<ReturnType<typeof getRedisClient>, null>;

        vi.mocked(getRedisClient).mockReturnValue(mockRedis);

        const result = await checkRateLimit('user2', 'test-action', 5, 60);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
        expect(result.resetIn).toBe(60);
        expect(mockRedis.pipeline).toHaveBeenCalled();
        expect(mockPipeline.incr).toHaveBeenCalledWith('ratelimit:test-action:user2:27876240');
    });

    it('blocks request when limit is exceeded', async () => {
        const mockPipeline = {
            incr: vi.fn().mockReturnThis(),
            expire: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue([[null, 6]]), // 6th request
        };
        const mockRedis = {
            pipeline: vi.fn().mockReturnValue(mockPipeline),
        } as unknown as Exclude<ReturnType<typeof getRedisClient>, null>;

        vi.mocked(getRedisClient).mockReturnValue(mockRedis);

        const result = await checkRateLimit('user3', 'test-action', 5, 60);

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.resetIn).toBe(60);
    });

    it('falls back to in-memory limiter if Redis pipeline throws an error', async () => {
        const mockPipeline = {
            incr: vi.fn().mockReturnThis(),
            expire: vi.fn().mockReturnThis(),
            exec: vi.fn().mockRejectedValue(new Error('Redis network error')),
        };
        const mockRedis = {
            pipeline: vi.fn().mockReturnValue(mockPipeline),
        } as unknown as Exclude<ReturnType<typeof getRedisClient>, null>;

        vi.mocked(getRedisClient).mockReturnValue(mockRedis);

        const result = await checkRateLimit('user4', 'test-action', 5, 60);

        // Falls back to in-memory limiter — request is allowed and counted.
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });

    it('falls back to in-memory limiter if Redis INCR returns an error inside pipeline results', async () => {
        const mockPipeline = {
            incr: vi.fn().mockReturnThis(),
            expire: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue([[new Error('WRONGTYPE'), null]]),
        };
        const mockRedis = {
            pipeline: vi.fn().mockReturnValue(mockPipeline),
        } as unknown as Exclude<ReturnType<typeof getRedisClient>, null>;

        vi.mocked(getRedisClient).mockReturnValue(mockRedis);

        const result = await checkRateLimit('user5', 'test-action', 5, 60);

        // Falls back to in-memory limiter — request is allowed and counted.
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });
});
