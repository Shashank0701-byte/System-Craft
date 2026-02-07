'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/firebase/AuthContext';

interface UseRequireAuthOptions {
    redirectTo?: string;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
    const { redirectTo = '/login' } = options;
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push(redirectTo);
        }
    }, [user, isLoading, router, redirectTo]);

    return { user, isLoading, isAuthenticated: !!user };
}
