'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/firebase/AuthContext';
import { logout } from '@/src/lib/firebase/auth';

interface CanvasHeaderProps {
  title?: string;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onTitleChange?: (newTitle: string) => void;
  onRunAIReview?: () => void;
}

export function CanvasHeader({
  title = 'Untitled Design',
  saveStatus = 'idle',
  onTitleChange,
  onRunAIReview
}: CanvasHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isCancellingRef = useRef(false);

  // Sync editValue when title prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title);
    }
  }, [title, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  // Sanitize avatar URL to prevent CSS injection
  const getSafeAvatarUrl = () => {
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
        // Invalid URL, fall through to default
      }
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=4725f4&color=fff&size=36`;
  };

  const avatarUrl = getSafeAvatarUrl();

  const handleStartEditing = () => {
    isCancellingRef.current = false;
    setIsEditing(true);
    setEditValue(title);
  };

  const handleSave = () => {
    if (isCancellingRef.current) {
      isCancellingRef.current = false;
      return;
    }

    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title && onTitleChange) {
      onTitleChange(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    isCancellingRef.current = true;
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!isCancellingRef.current && isEditing) {
        handleSave();
      }
    }, 0);
  };

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

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="ml-2 text-xs text-yellow-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="ml-2 text-xs text-green-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Saved
          </span>
        );
      case 'error':
        return (
          <span className="ml-2 text-xs text-red-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Save failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="relative h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-sidebar-bg-dark shrink-0 z-20">
      {/* Left: Logo & Breadcrumb */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary dark:text-white group">
          <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>hub</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight hidden md:block">SystemCraft</h2>
        </Link>
        <div className="h-6 w-px bg-slate-200 dark:bg-border-dark hidden md:block"></div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-slate-400 font-medium hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Projects
          </Link>
          <span className="text-slate-600 dark:text-slate-600">/</span>

          {/* Editable Title */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="bg-slate-100 dark:bg-surface-highlight-dark text-slate-900 dark:text-white font-medium px-2 py-1 rounded border border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[150px] max-w-[300px]"
                maxLength={100}
              />
            </div>
          ) : (
            <button
              onClick={handleStartEditing}
              className="group/title flex items-center gap-1 text-slate-900 dark:text-white font-medium hover:text-primary dark:hover:text-primary transition-colors"
              title="Click to rename"
            >
              <span className="max-w-[200px] truncate">{title}</span>
              <span className="material-symbols-outlined text-[16px] opacity-0 group-hover/title:opacity-60 transition-opacity">
                edit
              </span>
            </button>
          )}

          {renderSaveStatus()}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onRunAIReview}
          className="hidden md:flex h-9 items-center justify-center rounded-lg px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors shadow-lg shadow-primary/20 cursor-pointer"
        >
          <span className="material-symbols-outlined mr-2" style={{ fontSize: '18px' }}>auto_awesome</span>
          <span>Run AI Review</span>
        </button>
        <div className="h-9 w-px bg-slate-200 dark:bg-border-dark mx-1 hidden md:block"></div>
        <button className="flex items-center justify-center size-9 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>share</span>
        </button>
        <button className="flex items-center justify-center size-9 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
        </button>

        {/* User Dropdown */}
        <div className="ml-2 relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative cursor-pointer"
          >
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-9 border-2 border-white dark:border-[#2b2839] ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
              style={{ backgroundImage: `url("${avatarUrl}")` }}
            />
            <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-sidebar-bg-dark rounded-full"></div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dashboard-card rounded-xl shadow-xl border border-slate-200 dark:border-border-dark overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info */}
              <div className="p-3 border-b border-slate-200 dark:border-border-dark">
                <p className="font-medium text-slate-900 dark:text-white truncate text-sm">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-text-muted-dark truncate">
                  {user?.email || ''}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full px-3 py-2 flex items-center gap-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-highlight-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  <span>Dashboard</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-200 dark:border-border-dark py-1">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-3 py-2 flex items-center gap-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
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
