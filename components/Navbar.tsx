"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../src/lib/firebase/AuthContext";
import { logout } from "../src/lib/firebase/auth";

export default function Navbar() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/login" || pathname === "/signup";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/favicon.png"
            alt="SystemCraft Logo"
            width={42}
            height={42}
            priority
            unoptimized
          />

          <span className="text-lg font-bold tracking-tight">
            SystemCraft
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-white"
          >
            Features
          </Link>

          <Link
            href="#pricing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-white"
          >
            Pricing
          </Link>

          <Link
            href="#blog"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-white"
          >
            Blog
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <>
              <div className="hidden h-5 w-16 animate-pulse rounded bg-white/10 sm:block" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
            </>
          ) : isAuthPage ? null : !user ? (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-white sm:block"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                className="flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:shadow-primary/40"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Dashboard
              </Link>

              <button
                onClick={logout}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-red-400"
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