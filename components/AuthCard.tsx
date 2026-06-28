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

    // Post-login animation sequence phases: idle -> authenticating -> verifying -> locating -> loading_arch -> ready
    const [authPhase, setAuthPhase] = useState<'idle' | 'authenticating' | 'verifying' | 'locating' | 'loading_arch' | 'ready'>('idle');

    // Signup "Initializing Workspace" entry animation
    const [showForm, setShowForm] = useState(mode === 'login');

    useEffect(() => {
        if (mode === 'signup') {
            const timer = setTimeout(() => setShowForm(true), 800);
            return () => clearTimeout(timer);
        }
    }, [mode]);

    // If user is already logged in (not mid-sign-in, no sync failure), redirect
    useEffect(() => {
        if (!authLoading && currentUser && !signingInRef.current && !syncFailed && authPhase === 'idle') {
            router.push('/dashboard');
        }
    }, [authLoading, currentUser, syncFailed, authPhase, router]);

    // Post-login animation sequence checklist transitions
    useEffect(() => {
        if (!userSynced || syncFailed) return;

        let cancelled = false;

        const runSequence = async () => {
            setAuthPhase('verifying');
            await new Promise(r => setTimeout(r, 550));
            if (cancelled) return;

            setAuthPhase('locating');
            await new Promise(r => setTimeout(r, 550));
            if (cancelled) return;

            setAuthPhase('loading_arch');
            await new Promise(r => setTimeout(r, 600));
            if (cancelled) return;

            setAuthPhase('ready');
            await new Promise(r => setTimeout(r, 300));
            if (cancelled) return;

            router.push('/dashboard');
        };

        runSequence();
        return () => { cancelled = true; };
    }, [userSynced, syncFailed, router]);

    const handleProviderSignIn = useCallback(async (
        signInFn: () => Promise<User | null>,
        setLoading: (v: boolean) => void,
        provider: 'google' | 'github'
    ) => {
        setSignInError(null);
        setSuccessMessage(null);
        setSyncFailed(false);
        setLoading(true);
        signingInRef.current = true;
        setAuthPhase('authenticating');
        try {
            const user = await signInFn();
            if (user) {
                await syncUserWithDB(user, provider);
                setUserSynced(true);
            }
        } catch (error) {
            setSyncFailed(true);
            setSignInError(
                error instanceof Error
                    ? error.message
                    : `Failed to sign in with ${provider}. Please try again.`
            );
            setAuthPhase('idle');
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
        setAuthPhase('authenticating');

        let createdUser: User | null = null;

        try {
            if (mode === 'signup') {
                if (!displayName.trim()) {
                    setSignInError('Please enter your name.');
                    setAuthPhase('idle');
                    return;
                }
                createdUser = await signUpWithEmail(email, password, displayName.trim());
            } else {
                createdUser = await signInWithEmail(email, password);
            }

            if (!createdUser) {
                setSignInError('Authentication failed. Please try again.');
                setAuthPhase('idle');
                return;
            }

            await syncUserWithDB(createdUser, 'email');
            setUserSynced(true);
        } catch (error) {
            if (mode === 'signup' && createdUser) {
                try {
                    await logout();
                } catch {
                    // Best-effort cleanup
                }
            }
            setSyncFailed(true);
            setAuthPhase('idle');
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
            setSuccessMessage('Password reset email sent. Check your inbox.');
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

    // ── Shorter operational copywriting ──────────────────
    const heading = showResetPassword
        ? 'Recover Session'
        : mode === 'signup'
            ? 'Initialize Sandbox'
            : 'Resume Session';

    const subtitle = showResetPassword
        ? 'Provide credential key to recover session access.'
        : mode === 'signup'
            ? 'Provision a sandbox and begin designing resilient topologies.'
            : 'Initialize session to resume work on active architectures.';

    // Show nothing while checking auth (prevents flash)
    if (authLoading) {
        return (
            <div className="relative overflow-hidden w-full max-w-md rounded-2xl bg-[#0c0d16]/75 backdrop-blur-xl border border-white/[0.05] p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-center min-h-[300px]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <Spinner label="Loading" />
            </div>
        );
    }

    // If already logged in and synced (or was already logged in), don't render the card
    if (currentUser && !syncFailed && !signingInRef.current && authPhase === 'idle') return null;

    // ── Post-login animation sequence: observabillity handshake checklist ──
    if (authPhase !== 'idle') {
        const isVerifying = authPhase !== 'authenticating';
        const isLocating = authPhase === 'locating' || authPhase === 'loading_arch' || authPhase === 'ready';
        const isLoadingArch = authPhase === 'loading_arch' || authPhase === 'ready';
        const isReady = authPhase === 'ready';

        const getStatusMessage = () => {
            if (authPhase === 'authenticating') return 'Authenticating…';
            if (authPhase === 'verifying') return 'Session Verified';
            if (authPhase === 'locating') return 'Workspace Located';
            if (authPhase === 'loading_arch') return 'Loading Architecture…';
            return 'Ready.';
        };

        return (
            <div className="relative overflow-hidden w-full max-w-md rounded-2xl bg-[#0c0d16]/75 backdrop-blur-xl border border-white/[0.05] p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.6)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                
                <div className="flex flex-col items-center justify-center min-h-[300px] w-full py-4 select-none animate-[fade-in_0.3s_ease-out]">
                    <div className="w-full max-w-[280px] space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase transition-all duration-300">
                                {getStatusMessage()}
                            </span>
                        </div>
                        
                        <div className="space-y-3 pt-2.5 border-t border-dashed border-white/[0.05]">
                            {[
                                { id: 'authenticating', label: 'AUTHENTICATING', run: authPhase === 'authenticating', ok: isVerifying },
                                { id: 'verifying', label: 'VERIFYING SESSION', run: authPhase === 'verifying', ok: isLocating },
                                { id: 'locating', label: 'LOCATING WORKSPACE', run: authPhase === 'locating', ok: isLoadingArch },
                                { id: 'loading_arch', label: 'LOADING ARCHITECTURE', run: authPhase === 'loading_arch', ok: isReady },
                            ].map((step) => (
                                <div key={step.id} className="flex items-center justify-between font-mono text-[9px] tracking-wider">
                                    <span className={step.run ? "text-white" : step.ok ? "text-cyan-400/60" : "text-white/20"}>
                                        {step.label}
                                    </span>
                                    <span className={step.run ? "text-cyan-400 animate-pulse" : step.ok ? "text-emerald-400" : "text-white/10"}>
                                        {step.run ? "RUNNING" : step.ok ? "SUCCESS" : "PENDING"}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="h-[2px] w-full bg-white/[0.04] rounded-full overflow-hidden relative">
                            <div 
                                className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-500 ease-out" 
                                style={{
                                    width: authPhase === 'authenticating' ? '25%' : authPhase === 'verifying' ? '50%' : authPhase === 'locating' ? '75%' : authPhase === 'loading_arch' ? '90%' : '100%'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Refined input layout ─────────────────────────────
    const inputClasses = "w-full rounded-lg bg-[#060810] border border-white/[0.06] pl-10.5 pr-4 py-3.5 text-white placeholder-white/20 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:outline-none focus:border-cyan-500/35 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4),0_0_0_3px_rgba(34,211,238,0.06)] hover:border-white/[0.1] transition-all duration-200 disabled:opacity-50 font-body";

    // ── Signup "Initializing Workspace" entry animation ──
    if (mode === 'signup' && !showForm) {
        return (
            <div className="relative overflow-hidden w-full max-w-md rounded-2xl bg-[#0c0d16]/75 backdrop-blur-xl border border-white/[0.05] p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.6)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/30">Initializing Workspace…</span>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative overflow-hidden w-full max-w-md rounded-2xl bg-[#0c0d16]/75 backdrop-blur-xl border border-white/[0.05] p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.6)] ${mode === 'signup' ? 'transition-opacity duration-500' : 'animate-[fade-in_0.5s_ease-out]'}`}
            style={mode === 'signup' ? { opacity: showForm ? 1 : 0 } : undefined}
        >
            {/* Top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

            <h1 className="text-2xl font-bold text-white/90 text-center tracking-tight font-display">
                {heading}
            </h1>
            <p className="text-sm text-white/40 text-center mt-2.5 leading-relaxed font-body">
                {subtitle}
            </p>

            {/* Error message */}
            {signInError && (
                <div className="mt-5 p-3 rounded-lg bg-rose-500/[0.07] border border-rose-500/15 text-rose-400/90 text-xs font-mono text-center">
                    {signInError}
                </div>
            )}

            {/* Success message */}
            {successMessage && (
                <div className="mt-5 p-3 rounded-lg bg-emerald-500/[0.07] border border-emerald-500/15 text-emerald-400/90 text-xs font-mono text-center">
                    {successMessage}
                </div>
            )}

            {showResetPassword ? (
                /* ── Password Reset Form ─────────────────────── */
                <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="reset-email" className="block text-[10px] font-mono tracking-wider text-white/30 mb-2 uppercase">Email</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15 text-[17px] select-none">
                                mail
                            </span>
                            <input
                                id="reset-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                disabled={isLoading}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#080a12] py-3.5 font-bold text-xs uppercase tracking-wider shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cyan-50 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_28px_-5px_rgba(34,211,238,0.2)] active:translate-y-px active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                    >
                        {isResetting ? (
                            <>
                                <Spinner label="Sending recovery link" className="h-4 w-4 text-[#080a12]" />
                                Sending recovery link…
                            </>
                        ) : (
                            'Send Recovery Link'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setShowResetPassword(false); setSignInError(null); }}
                        className="w-full text-xs text-white/30 hover:text-white/60 transition-colors duration-200 cursor-pointer"
                    >
                        ← Back to authentication
                    </button>
                </form>
            ) : (
                <>
                    {/* ── Email/Password Form ────────────────────── */}
                    <form onSubmit={handleEmailSubmit} className="mt-8 space-y-6">
                        {mode === 'signup' && (
                            <div>
                                <label htmlFor="auth-name" className="block text-[10px] font-mono tracking-wider text-white/30 mb-2 uppercase">Full Name</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15 text-[17px] select-none">
                                        person
                                    </span>
                                    <input
                                        id="auth-name"
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Jane Doe"
                                        required
                                        disabled={isLoading}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="auth-email" className="block text-[10px] font-mono tracking-wider text-white/30 mb-2 uppercase">Email</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15 text-[17px] select-none">
                                    mail
                                </span>
                                <input
                                    id="auth-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="auth-password" className="block text-[10px] font-mono tracking-wider text-white/30 uppercase">Password</label>
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => { setShowResetPassword(true); setSignInError(null); setSuccessMessage(null); }}
                                        className="text-[10px] text-cyan-400/50 hover:text-cyan-400/80 transition-colors duration-200 cursor-pointer font-mono"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15 text-[17px] select-none">
                                    lock
                                </span>
                                <input
                                    id="auth-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                                    required
                                    minLength={6}
                                    disabled={isLoading}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#080a12] py-3.5 font-bold text-xs uppercase tracking-wider shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cyan-50 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_28px_-5px_rgba(34,211,238,0.2)] active:translate-y-px active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                        >
                            {isLoadingEmail ? (
                                <>
                                    <Spinner label="Processing" className="h-4 w-4 text-[#080a12]" />
                                    {mode === 'signup' ? 'Initializing sandbox…' : 'Authenticating…'}
                                </>
                            ) : (
                                mode === 'signup' ? 'Initialize Sandbox' : 'Authenticate'
                            )}
                        </button>
                    </form>

                    {/* ── Divider ─────────────────────────────────── */}
                    <div className="mt-6 flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[10px] text-white/20 uppercase tracking-[0.15em] font-mono">or</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    {/* ── OAuth: Google ───────────────────────────── */}
                    <button
                        onClick={() => handleProviderSignIn(signInWithGoogle, setIsLoadingGoogle, 'google')}
                        disabled={isLoading}
                        aria-busy={isLoadingGoogle}
                        className="mt-4 w-full flex items-center justify-center gap-2.5 rounded-lg bg-transparent border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] py-2.5 text-white/50 hover:text-white/70 text-[13px] font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isLoadingGoogle ? (
                            <>
                                <Spinner label="Signing in" className="h-4 w-4" />
                                <span className="text-white/40">Connecting…</span>
                            </>
                        ) : (
                            <>
                                <Image src="/google.svg" width={15} height={15} alt="" />
                                Google
                            </>
                        )}
                    </button>

                    {/* ── OAuth: GitHub ───────────────────────────── */}
                    <button
                        onClick={() => handleProviderSignIn(signInWithGitHub, setIsLoadingGitHub, 'github')}
                        disabled={isLoading}
                        aria-busy={isLoadingGitHub}
                        className="mt-2.5 w-full flex items-center justify-center gap-2.5 rounded-lg bg-transparent border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] py-2.5 text-white/50 hover:text-white/70 text-[13px] font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isLoadingGitHub ? (
                            <>
                                <Spinner label="Signing in" className="h-4 w-4" />
                                <span className="text-white/40">Connecting…</span>
                            </>
                        ) : (
                            <>
                                <Image src="/github.svg" width={15} height={15} alt="" />
                                GitHub
                            </>
                        )}
                    </button>
                </>
            )}

            {/* ── Footer text ────────────────────────────────── */}
            <p className="mt-8 text-center text-xs text-white/25">
                {mode === 'signup' ? (
                    <>Already have a workspace?{' '}
                        <Link href="/login" className="text-cyan-400/50 hover:text-cyan-400/80 transition-colors duration-200">
                            Authenticate
                        </Link>
                    </>
                ) : (
                    <>New to SystemCraft?{' '}
                        <Link href="/signup" className="text-cyan-400/50 hover:text-cyan-400/80 transition-colors duration-200">
                            Create a workspace
                        </Link>
                    </>
                )}
            </p>

            <div className="mt-5 flex justify-center gap-5 text-[10px] text-white/15">
                <Link href="/terms" className="hover:text-white/30 transition-colors duration-200">
                    Terms of Service
                </Link>
                <Link href="/privacy" className="hover:text-white/30 transition-colors duration-200">
                    Privacy Policy
                </Link>
            </div>

            {/* ── Subtle status indicator ────────────────────── */}
            <div className="mt-6 flex items-center justify-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-400/40" />
                <span className="text-[9px] font-mono text-white/15 tracking-wide">
                    Interview Engine · Online
                </span>
            </div>
        </div>
    );
}
