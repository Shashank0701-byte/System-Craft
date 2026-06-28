'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/firebase/AuthContext';

interface UseRequireAuthOptions {
    redirectTo?: string;
    disabled?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
    const { redirectTo = '/login', disabled = false } = options;
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (disabled) return;
        if (!isLoading && !user) {
            router.push(redirectTo);
        }
    }, [user, isLoading, router, redirectTo, disabled]);

    return { user, isLoading, isAuthenticated: !!user };
}
