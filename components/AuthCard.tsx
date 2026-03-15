"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail, resetPassword, logout } from "../src/lib/firebase/auth";
import { useAuth } from "../src/lib/firebase/AuthContext";
import { User } from "firebase/auth";
import { Spinner } from "./ui/Spinner";

// Sync Firebase user with MongoDB - throws on failure
async function syncUserWithDB(user: User, provider: 'google' | 'github' | 'email') {
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
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
    const [isLoadingEmail, setIsLoadingEmail] = useState(false);
    const [signInError, setSignInError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [userSynced, setUserSynced] = useState(false);

    // Track whether a sign-in flow is actively running (prevents premature redirect)
    const signingInRef = useRef(false);

    // Email/password form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [syncFailed, setSyncFailed] = useState(false);

    // If user is already logged in (not mid-sign-in, no sync failure) OR sync completed, redirect
    useEffect(() => {
        if (!authLoading && currentUser && !signingInRef.current && !syncFailed) {
            router.push('/dashboard');
        }
        if (userSynced && !syncFailed) {
            router.push('/dashboard');
        }
    }, [authLoading, currentUser, userSynced, syncFailed, router]);

    const handleProviderSignIn = useCallback(async (
        signInFn: () => Promise<User | null>,
        setLoading: (v: boolean) => void,
        provider: 'google' | 'github'
    ) => {
        setSignInError(null);
        setSuccessMessage(null);
        setLoading(true);
        signingInRef.current = true;
        try {
            const user = await signInFn();
            if (!user) {
                setSignInError(`Failed to sign in with ${provider}. Please try again.`);
                return;
            }
            await syncUserWithDB(user, provider);
            setUserSynced(true);
        } catch (error) {
            setSignInError(
                error instanceof Error
                    ? error.message
                    : `Failed to sign in with ${provider}. Please try again.`
            );
        } finally {
            signingInRef.current = false;
            setLoading(false);
        }
    }, []);

    const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSignInError(null);
        setSuccessMessage(null);
        setSyncFailed(false);
        setIsLoadingEmail(true);
        signingInRef.current = true;

        let createdUser: User | null = null;

        try {
            if (mode === 'signup') {
                if (!displayName.trim()) {
                    setSignInError('Please enter your name.');
                    return;
                }
                createdUser = await signUpWithEmail(email, password, displayName.trim());
            } else {
                createdUser = await signInWithEmail(email, password);
            }

            if (!createdUser) {
                setSignInError('Authentication failed. Please try again.');
                return;
            }

            await syncUserWithDB(createdUser, 'email');
            setUserSynced(true);
        } catch (error) {
            // If signup created a Firebase user but DB sync failed, clean up
            if (mode === 'signup' && createdUser) {
                try {
                    await logout();
                } catch {
                    // Best-effort cleanup
                }
            }
            setSyncFailed(true);
            setSignInError(
                error instanceof Error
                    ? error.message
                    : 'Authentication failed. Please try again.'
            );
        } finally {
            signingInRef.current = false;
            setIsLoadingEmail(false);
        }
    }, [mode, email, password, displayName]);

    const handlePasswordReset = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSignInError(null);
        setSuccessMessage(null);

        if (!email.trim()) {
            setSignInError('Please enter your email address.');
            return;
        }

        setIsResetting(true);
        try {
            await resetPassword(email);
            setSuccessMessage('Password reset email sent! Check your inbox.');
            setShowResetPassword(false);
        } catch (error) {
            setSignInError(
                error instanceof Error
                    ? error.message
                    : 'Failed to send reset email.'
            );
        } finally {
            setIsResetting(false);
        }
    }, [email]);

    const isLoading = isLoadingGoogle || isLoadingGitHub || isLoadingEmail || isResetting;

    // Show nothing while checking auth (prevents flash)
    if (authLoading) {
        return (
            <div className="w-full max-w-md rounded-2xl bg-[#141022]/80 backdrop-blur border border-white/10 p-8 shadow-2xl flex items-center justify-center min-h-[300px]">
                <Spinner label="Loading" />
            </div>
        );
    }

    // If already logged in and synced (or was already logged in), don't render the card
    if (currentUser && !syncFailed && !signingInRef.current) return null;

    return (
        <div className="w-full max-w-md rounded-2xl bg-[#141022]/80 backdrop-blur border border-white/10 p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-white text-center">
                {showResetPassword
                    ? 'Reset Password'
                    : mode === 'signup' ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-center mt-2">
                {showResetPassword
                    ? 'Enter your email to receive a reset link.'
                    : mode === 'signup'
                        ? 'Get started designing system architectures for free.'
                        : 'Sign in to start designing system architectures.'}
            </p>

            {/* Error message */}
            {signInError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {signInError}
                </div>
            )}

            {/* Success message */}
            {successMessage && (
                <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                    {successMessage}
                </div>
            )}

            {showResetPassword ? (
                /* Password Reset Form */
                <form onSubmit={handlePasswordReset} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                        <input
                            id="reset-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            disabled={isLoading}
                            className="w-full rounded-lg bg-[#1f1b33] border border-white/10 px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition disabled:opacity-50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        aria-busy={isResetting}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover py-3 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResetting ? (
                            <>
                                <Spinner label="Sending reset link" />
                                Sending reset link...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setShowResetPassword(false); setSignInError(null); }}
                        className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        ← Back to sign in
                    </button>
                </form>
            ) : (
                <>
                    {/* Email/Password Form */}
                    <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                        {mode === 'signup' && (
                            <div>
                                <label htmlFor="auth-name" className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                                <input
                                    id="auth-name"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                    disabled={isLoading}
                                    className="w-full rounded-lg bg-[#1f1b33] border border-white/10 px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition disabled:opacity-50"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="auth-email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <input
                                id="auth-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={isLoading}
                                className="w-full rounded-lg bg-[#1f1b33] border border-white/10 px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="auth-password" className="block text-sm font-medium text-slate-300">Password</label>
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => { setShowResetPassword(true); setSignInError(null); setSuccessMessage(null); }}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <input
                                id="auth-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                                required
                                minLength={6}
                                disabled={isLoading}
                                className="w-full rounded-lg bg-[#1f1b33] border border-white/10 px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition disabled:opacity-50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover py-3 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingEmail ? (
                                <>
                                    <Spinner label="Processing" />
                                    {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                                </>
                            ) : (
                                mode === 'signup' ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-5 flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-slate-500 uppercase tracking-wider">or continue with</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Google */}
                    <button
                        onClick={() => handleProviderSignIn(signInWithGoogle, setIsLoadingGoogle, 'google')}
                        disabled={isLoading}
                        aria-busy={isLoadingGoogle}
                        className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg bg-[#1f1b33] hover:bg-[#2a2450] border border-white/10 py-3 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingGoogle ? (
                            <>
                                <Spinner label="Signing in" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <Image src="/google.svg" width={20} height={20} alt="" />
                                Google
                            </>
                        )}
                    </button>

                    {/* GitHub */}
                    <button
                        onClick={() => handleProviderSignIn(signInWithGitHub, setIsLoadingGitHub, 'github')}
                        disabled={isLoading}
                        aria-busy={isLoadingGitHub}
                        className="mt-3 w-full flex items-center justify-center gap-3 rounded-lg bg-[#1f1b33] hover:bg-[#2a2450] border border-white/10 py-3 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingGitHub ? (
                            <>
                                <Spinner label="Signing in" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <Image src="/github.svg" width={20} height={20} alt="" />
                                GitHub
                            </>
                        )}
                    </button>
                </>
            )}

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
