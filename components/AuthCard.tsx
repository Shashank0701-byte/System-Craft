"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithGoogle, signInWithGitHub } from "../src/lib/firebase/auth";

export default function AuthCard() {
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
    const [signInError, setSignInError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setSignInError(null);
        setIsLoadingGoogle(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            setSignInError(
                error instanceof Error
                    ? error.message
                    : "Failed to sign in with Google. Please try again."
            );
        } finally {
            setIsLoadingGoogle(false);
        }
    };

    const handleGitHubSignIn = async () => {
        setSignInError(null);
        setIsLoadingGitHub(true);
        try {
            await signInWithGitHub();
        } catch (error) {
            setSignInError(
                error instanceof Error
                    ? error.message
                    : "Failed to sign in with GitHub. Please try again."
            );
        } finally {
            setIsLoadingGitHub(false);
        }
    };

    const isLoading = isLoadingGoogle || isLoadingGitHub;

    return (
        <div className="w-full max-w-md rounded-2xl bg-[#141022]/80 backdrop-blur border border-white/10 p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-white text-center">
                Welcome Back
            </h1>
            <p className="text-slate-400 text-center mt-2">
                Sign in to continue your interview prep.
            </p>

            {/* Error message */}
            {signInError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {signInError}
                </div>
            )}

            {/* Google */}
            <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="mt-6 w-full flex items-center justify-center gap-3 rounded-lg bg-[#1f1b33] hover:bg-[#2a2450] border border-white/10 py-3 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoadingGoogle ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Signing in...
                    </>
                ) : (
                    <>
                        <img src="/google.svg" className="h-5 w-5" alt="Google" />
                        Continue with Google
                    </>
                )}
            </button>

            {/* GitHub */}
            <button
                onClick={handleGitHubSignIn}
                disabled={isLoading}
                className="mt-3 w-full flex items-center justify-center gap-3 rounded-lg bg-[#1f1b33] hover:bg-[#2a2450] border border-white/10 py-3 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoadingGitHub ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Signing in...
                    </>
                ) : (
                    <>
                        <img src="/github.svg" className="h-5 w-5" alt="GitHub" />
                        Continue with GitHub
                    </>
                )}
            </button>

            {/* Footer text */}
            <p className="mt-6 text-center text-sm text-slate-500">
                New to SystemCraft?{" "}
                <Link
                    href="/signup"
                    className="text-primary hover:underline"
                >
                    Create an account
                </Link>
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
