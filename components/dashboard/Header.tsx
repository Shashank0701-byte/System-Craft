'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/firebase/AuthContext';
import { logout } from '@/src/lib/firebase/auth';

export function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  // Get safe avatar URL
  const getAvatarUrl = () => {
    const photoURL = user?.photoURL;
    if (photoURL) {
      try {
        const url = new URL(photoURL);
        if (url.protocol === 'https:' &&
          (url.hostname.endsWith('googleusercontent.com') ||
            url.hostname.endsWith('githubusercontent.com') ||
            url.hostname.endsWith('ui-avatars.com'))) {
          return photoURL;
        }
      } catch {
        // Invalid URL
      }
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=4725f4&color=fff&size=40`;
  };

  return (
    <header className="h-16 flex-shrink-0 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-dashboard-bg flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-text-muted-dark material-symbols-outlined text-[20px]">search</span>
          <input className="w-full h-10 rounded-lg border-none bg-slate-100 dark:bg-dashboard-card pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-text-placeholder-dark focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Search designs..." type="text" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="size-10 flex items-center justify-center rounded-full text-slate-500 dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-dashboard-card transition-colors relative cursor-pointer">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-dashboard-bg"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-dashboard-card transition-colors cursor-pointer"
          >
            <div
              className="size-9 rounded-full bg-cover bg-center ring-2 ring-primary/20"
              style={{ backgroundImage: `url("${getAvatarUrl()}")` }}
            />
            <span className="material-symbols-outlined text-slate-500 dark:text-text-muted-dark text-[20px]">
              {isDropdownOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-dashboard-card rounded-xl shadow-xl border border-slate-200 dark:border-border-dark overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info */}
              <div className="p-4 border-b border-slate-200 dark:border-border-dark">
                <div className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-full bg-cover bg-center ring-2 ring-primary/20"
                    style={{ backgroundImage: `url("${getAvatarUrl()}")` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-text-muted-dark truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-highlight-dark transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                  <span>Settings</span>
                </button>
                <button className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-highlight-dark transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">help</span>
                  <span>Help & Support</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-200 dark:border-border-dark py-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
