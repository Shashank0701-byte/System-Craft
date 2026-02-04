"use client";

import { signInWithGoogle, signInWithGitHub } from "../src/lib/firebase/auth";

export default function AuthCard() {
    return (
        <div className="w-full max-w-md rounded-2xl bg-[#141022]/80 backdrop-blur border border-white/10 p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-white text-center">
                Welcome Back
            </h1>
            <p className="text-slate-400 text-center mt-2">
                Sign in to continue your interview prep.
            </p>

            {/* Google */}
            <button
                onClick={signInWithGoogle}
                className="mt-6 w-full flex items-center justify-center gap-3 rounded-lg bg-[#1f1b33] hover:bg-[#2a2450] border border-white/10 py-3 text-white font-medium transition"
            >
                <img src="/google.svg" className="h-5 w-5" />
                Continue with Google
            </button>

            {/* GitHub */}
            <button
                onClick={signInWithGitHub}
                className="mt-3 w-full flex items-center justify-center gap-3 rounded-lg bg-[#1f1b33] hover:bg-[#2a2450] border border-white/10 py-3 text-white font-medium transition"
            >
                <img src="/github.svg" className="h-5 w-5" />
                Continue with GitHub
            </button>

            {/* Footer text */}
            <p className="mt-6 text-center text-sm text-slate-500">
                New to SystemCraft?{" "}
                <span className="text-primary cursor-pointer hover:underline">
                    Create an account
                </span>
            </p>

            <div className="mt-6 flex justify-center gap-6 text-xs text-slate-500">
                <span className="hover:text-white cursor-pointer">Terms of Service</span>
                <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            </div>
        </div>
    );
}
