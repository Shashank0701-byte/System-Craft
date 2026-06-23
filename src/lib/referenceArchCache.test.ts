import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCachedArchitecture } from './referenceArchCache';
import { getRedisClient } from './redis';
import { REFERENCE_ARCHITECTURES } from './referenceArchitectures';

vi.mock('./redis', () => ({
    getRedisClient: vi.fn(),
}));

describe('referenceArchCache', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCachedArchitecture', () => {
        it('returns from cache on a hit', async () => {
            const mockRedis = {
                get: vi.fn().mockResolvedValue(JSON.stringify({ id: 'test', name: 'Cached Arch' })),
                setex: vi.fn(),
            } as unknown as Exclude<ReturnType<typeof getRedisClient>, null>;
            vi.mocked(getRedisClient).mockReturnValue(mockRedis);

            const result = await getCachedArchitecture('test');

            expect(mockRedis.get).toHaveBeenCalledWith('ref-arch:test');
            expect(result).toEqual({ id: 'test', name: 'Cached Arch' });
            expect(mockRedis.setex).not.toHaveBeenCalled(); // No update needed
        });

        it('fetches from source and sets cache on a miss', async () => {
            const mockRedis = {
                get: vi.fn().mockResolvedValue(null), // Cache miss
                setex: vi.fn().mockResolvedValue('OK'),
            } as unknown as Exclude<ReturnType<typeof getRedisClient>, null>;
            vi.mocked(getRedisClient).mockReturnValue(mockRedis);

            // Use the first real architecture for the test
            const targetId = REFERENCE_ARCHITECTURES[0].id;
            const result = await getCachedArchitecture(targetId);

            expect(mockRedis.get).toHaveBeenCalledWith(`ref-arch:${targetId}`);
            expect(result).toEqual(REFERENCE_ARCHITECTURES[0]);
            expect(mockRedis.setex).toHaveBeenCalledWith(
                `ref-arch:${targetId}`,
                3600,
                expect.any(String)
            );
        });

        it('fails open and fetches from source if Redis throws on GET', async () => {
            const mockRedis = {
                get: vi.fn().mockRejectedValue(new Error('Connection lost')),
                setex: vi.fn().mockResolvedValue('OK'),
            } as unknown as Exclude<ReturnType<typeof getRedisClient>, null>;
            vi.mocked(getRedisClient).mockReturnValue(mockRedis);

            const targetId = REFERENCE_ARCHITECTURES[0].id;
            const result = await getCachedArchitecture(targetId);

            // Should gracefully catch error and still return data
            expect(result).toEqual(REFERENCE_ARCHITECTURES[0]);
            // Still attempts to populate cache (which might also fail, but it's fine)
            expect(mockRedis.setex).toHaveBeenCalled();
        });

        it('fails open if Redis is completely unavailable', async () => {
            vi.mocked(getRedisClient).mockReturnValue(null);

            const targetId = REFERENCE_ARCHITECTURES[0].id;
            const result = await getCachedArchitecture(targetId);

            expect(result).toEqual(REFERENCE_ARCHITECTURES[0]);
        });
        
        it('returns null for an invalid ID', async () => {
            vi.mocked(getRedisClient).mockReturnValue(null);
            
            const result = await getCachedArchitecture('non-existent-id');
            
            expect(result).toBeNull();
        });
    });
});
