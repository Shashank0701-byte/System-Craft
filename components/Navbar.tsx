"use client";

import Link from "next/link";
import { useAuth } from "../src/lib/firebase/AuthContext";
import { logout } from "../src/lib/firebase/auth";

export default function Navbar() {
  const { user, isLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-white/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="size-8 text-primary flex items-center justify-center bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-[24px]">hub</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">SystemCraft</h2>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#blog"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
          >
            Blog
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            // Skeleton loader while auth state is being determined
            <div className="flex items-center gap-4">
              <div className="hidden sm:block w-16 h-5 bg-white/10 rounded animate-pulse" />
              <div className="w-24 h-9 bg-white/10 rounded-lg animate-pulse" />
            </div>
          ) : !user ? (
            <>
              <Link
                href="/login"
                className="hidden sm:flex text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>

              <Link
                href="/login"
                className="cursor-pointer flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-primary/40 transition-all"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>

              <button
                onClick={logout}
                className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
