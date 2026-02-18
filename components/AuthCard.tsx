"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signInWithGoogle, signInWithGitHub } from "../src/lib/firebase/auth";
import { User } from "firebase/auth";
import { Spinner } from "./ui/Spinner";

// Sync Firebase user with MongoDB - throws on failure
async function syncUserWithDB(user: User, provider: 'google' | 'github') {
    // Need to get fresh token after sign-in
    const token = await user.getIdToken();

    const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            displayName: user.displayName,
            photoURL: user.photoURL,
            provider,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to sync user with database');
    }

    return response.json();
}

interface AuthCardProps {
    mode?: 'login' | 'signup';
}

export default function AuthCard({ mode = 'login' }: AuthCardProps) {
    const router = useRouter();
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
    const [signInError, setSignInError] = useState<string | null>(null);

    const handleProviderSignIn = useCallback(async (
        signInFn: () => Promise<User | null>,
        setLoading: (v: boolean) => void,
        provider: 'google' | 'github'
    ) => {
        setSignInError(null);
        setLoading(true);
        try {
            const user = await signInFn();
            if (!user) {
                setSignInError(`Failed to sign in with ${provider}. Please try again.`);
                return;
            }
            await syncUserWithDB(user, provider);
            router.push('/dashboard');
        } catch (error) {
            setSignInError(
                error instanceof Error
                    ? error.message
                    : `Failed to sign in with ${provider}. Please try again.`
            );
        } finally {
            setLoading(false);
        }
    }, [router]);

    const isLoading = isLoadingGoogle || isLoadingGitHub;

    return (
        <div className="w-full max-w-md rounded-2xl bg-[#141022]/80 backdrop-blur border border-white/10 p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-white text-center">
                {mode === 'signup' ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-center mt-2">
                {mode === 'signup'
                    ? 'Get started designing system architectures for free.'
                    : 'Sign in to start designing system architectures.'}
            </p>

            {/* Error message */}
            {signInError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {signInError}
                </div>
            )}

            {/* Google */}
            <button
                onClick={() => handleProviderSignIn(signInWithGoogle, setIsLoadingGoogle, 'google')}
                disabled={isLoading}
                className="mt-6 w-full flex items-center justify-center gap-3 rounded-lg bg-[#1f1b33] hover:bg-[#2a2450] border border-white/10 py-3 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoadingGoogle ? (
                    <>
                        <Spinner />
                        Signing in...
                    </>
                ) : (
                    <>
                        <Image src="/google.svg" width={20} height={20} alt="" />
                        Continue with Google
                    </>
                )}
            </button>

            {/* GitHub */}
            <button
                onClick={() => handleProviderSignIn(signInWithGitHub, setIsLoadingGitHub, 'github')}
                disabled={isLoading}
                className="mt-3 w-full flex items-center justify-center gap-3 rounded-lg bg-[#1f1b33] hover:bg-[#2a2450] border border-white/10 py-3 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoadingGitHub ? (
                    <>
                        <Spinner />
                        Signing in...
                    </>
                ) : (
                    <>
                        <Image src="/github.svg" width={20} height={20} alt="" />
                        Continue with GitHub
                    </>
                )}
            </button>

            {/* Footer text */}
            <p className="mt-6 text-center text-sm text-slate-500">
                {mode === 'signup' ? (
                    <>Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </>
                ) : (
                    <>New to SystemCraft?{' '}
                        <Link href="/signup" className="text-primary hover:underline">
                            Create an account
                        </Link>
                    </>
                )}
            </p>

            <div className="mt-6 flex justify-center gap-6 text-xs text-slate-500">
                <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                </Link>
                <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                </Link>
            </div>
        </div>
    );
}
