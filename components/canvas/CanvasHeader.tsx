'use client';

import Link from 'next/link';
import { useAuth } from '@/src/lib/firebase/AuthContext';

interface CanvasHeaderProps {
  title?: string;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onRunAIReview?: () => void;
}

export function CanvasHeader({ title = 'Untitled Design', saveStatus = 'idle', onRunAIReview }: CanvasHeaderProps) {
  const { user } = useAuth();

  const avatarUrl = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=4725f4&color=fff&size=36`;

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
          <span className="text-slate-900 dark:text-white font-medium">{title}</span>
          {renderSaveStatus()}
        </div>
      </div>

      {/* Center: Placeholder for future features like interview mode timer */}

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
        <div className="ml-2 relative group cursor-pointer">
          <div
            className="bg-center bg-no-repeat bg-cover rounded-full size-9 border-2 border-white dark:border-[#2b2839] ring-2 ring-primary/20"
            style={{ backgroundImage: `url("${avatarUrl}")` }}
          >
          </div>
          <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-sidebar-bg-dark rounded-full"></div>
        </div>
      </div>
    </header>
  );
}
