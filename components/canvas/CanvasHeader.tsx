'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/firebase/AuthContext';
import { logout } from '@/src/lib/firebase/auth';
import { useCanvasPanels } from './CanvasPanelsContext';
import { toJpeg } from 'html-to-image';

interface CanvasHeaderProps {
  title?: string;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onTitleChange?: (newTitle: string) => void;
  onRunAIReview?: () => void;
  onAIReview?: () => void;
  onBack?: () => void;
}

export function CanvasHeader({
  title = 'Untitled Design',
  saveStatus = 'idle',
  onTitleChange,
  onRunAIReview,
  onAIReview,
  onBack
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
  const { toggleLeft, toggleRight } = useCanvasPanels();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportImage = async () => {
    const canvasElement = document.getElementById('design-canvas-container');
    if (!canvasElement) return;
    
    try {
      setIsExporting(true);
      // Temporarily mock console.error to suppress harmless SecurityError from cross-origin stylesheets in html-to-image
      const originalError = console.error;
      console.error = (...args) => {
        if (args[0]?.name === 'SecurityError' || (typeof args[0] === 'string' && args[0].includes('cssRules'))) return;
        originalError.apply(console, args);
      };

      // Add class to disable animations and backdrop-filters that break html-to-image
      canvasElement.classList.add('exporting-canvas');

      const dataUrl = await toJpeg(canvasElement, { 
        quality: 0.9,
        cacheBust: true, 
        backgroundColor: '#060810',
        pixelRatio: window.devicePixelRatio ? window.devicePixelRatio * 2 : 2,
        filter: (node) => {
          // Skip UI elements like toolbars and absolute positioned panels that might pollute the canvas
          if (node instanceof HTMLElement) {
             if (node.classList.contains('absolute') && node.classList.contains('z-50')) return false;
          }
          return true;
        }
      });

      canvasElement.classList.remove('exporting-canvas');

      const link = document.createElement('a');
      link.download = `system-design-${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = dataUrl;
      link.click();
      
      console.error = originalError; // Restore original console.error
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExporting(false);
    }
  };

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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=0c0d16&color=fff&size=36`;
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
    } finally {
      setIsLoggingOut(false);
    }
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="text-[11px] font-mono text-white/40 flex items-center gap-2 select-none">
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
            Syncing...
          </span>
        );
      case 'saved':
        return (
          <span className="text-[11px] font-mono text-white/40 flex items-center gap-2 select-none">
            <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            Saved to cloud
          </span>
        );
      case 'error':
        return (
          <span className="text-[11px] font-mono text-red-400/80 flex items-center gap-2 select-none">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            Offline
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="relative h-12 flex items-center justify-between px-4 border-b border-white/[0.04] bg-[#060810] shrink-0 z-20">
      {/* Noise background */}
      <div className="noise-overlay absolute inset-0 pointer-events-none opacity-[0.02]" />

      {/* Left: Mobile components toggle + Logo & Breadcrumb */}
      <div className="flex items-center gap-4 z-10">
        {/* Mobile: Components toggle */}
        <button
          onClick={toggleLeft}
          className="md:hidden flex-shrink-0 p-1 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/[0.02] transition-colors cursor-pointer"
          aria-label="Toggle components"
          title="Components"
        >
          <span className="material-symbols-outlined text-[18px]">widgets</span>
        </button>

        <div className="flex items-center gap-2">
          {onBack ? (
            <button onClick={onBack} className="text-white/40 hover:text-white/80 transition-colors select-none text-[13px] font-mono font-bold tracking-wider">
              Workspace
            </button>
          ) : (
            <Link href="/dashboard" className="text-white/40 hover:text-white/80 transition-colors select-none text-[13px] font-mono font-bold tracking-wider">
              Workspace
            </Link>
          )}
          <span className="text-white/20 select-none text-[13px] font-mono">/</span>

          {/* Editable Title */}
          {isEditing ? (
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="bg-transparent text-white focus:outline-none focus:ring-0 border-none p-0 text-[13px] font-mono font-bold tracking-wider w-[150px]"
                maxLength={100}
              />
            </div>
          ) : (
            <button
              onClick={handleStartEditing}
              className="group/title flex items-center gap-1.5 text-white/90 hover:text-white transition-colors cursor-pointer text-[13px] font-mono font-bold tracking-wider"
              title="Click to rename"
            >
              <span className="max-w-[200px] truncate">{title}</span>
            </button>
          )}
        </div>

        {renderSaveStatus() && (
          <div className="hidden md:flex items-center ml-4">
            {renderSaveStatus()}
          </div>
        )}
      </div>

      {/* Right: Mobile properties toggle + Actions */}
      <div className="flex items-center gap-2 z-10">
        {/* Mobile: Properties toggle */}
        <button
          onClick={toggleRight}
          className="md:hidden flex-shrink-0 p-1 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/[0.02] transition-colors cursor-pointer"
          aria-label="Toggle properties"
          title="Properties"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
        </button>

        {(onRunAIReview || onAIReview) && (
          <button
            onClick={onAIReview || onRunAIReview}
            className="hidden md:flex h-[26px] items-center justify-center px-3 bg-white text-black font-mono text-[12px] font-bold tracking-wider hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)] active:translate-y-[0px] active:scale-[0.98] transition-all cursor-pointer select-none rounded-[4px] border border-transparent"
          >
            <span>AI Architecture Review</span>
          </button>
        )}

        <div className="h-5 w-px bg-white/[0.06] mx-1 hidden md:block"></div>

        <button 
          onClick={handleExportImage}
          disabled={isExporting}
          className="flex items-center justify-center size-7 rounded-lg hover:bg-white/[0.02] text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-50"
          title="Export as Image"
        >
          {isExporting ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[16px]">image</span>
          )}
        </button>
        <button className="flex items-center justify-center size-7 rounded-lg hover:bg-white/[0.02] text-white/40 hover:text-white/70 transition-colors cursor-pointer" title="Share">
          <span className="material-symbols-outlined text-[16px]">share</span>
        </button>
        <button className="flex items-center justify-center size-7 rounded-lg hover:bg-white/[0.02] text-white/40 hover:text-white/70 transition-colors cursor-pointer" title="Save">
          <span className="material-symbols-outlined text-[16px]">save</span>
        </button>

        {/* User Dropdown */}
        <div className="ml-1 relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative cursor-pointer flex items-center justify-center size-7 rounded-full overflow-hidden border border-white/[0.08] hover:border-white/20 transition-colors"
          >
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-full"
              style={{ backgroundImage: `url("${avatarUrl}")` }}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#0c0d16] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/[0.06] overflow-hidden z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* User Info */}
              <div className="p-2.5 border-b border-white/[0.04]">
                <p className="text-[10px] font-mono tracking-wider uppercase text-white/80 truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-[9px] font-mono text-white/30 truncate mt-0.5">
                  {user?.email || ''}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-0.5">
                <Link
                  href="/dashboard"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full px-2.5 py-1.5 flex items-center gap-2 rounded-lg text-left text-[10px] font-mono uppercase tracking-wider text-white/50 hover:bg-white/[0.02] hover:text-white/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">dashboard</span>
                  <span>Dashboard</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-white/[0.04] py-0.5 mt-0.5">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-2.5 py-1.5 flex items-center gap-2 rounded-lg text-left text-[10px] font-mono uppercase tracking-wider text-red-400 hover:bg-red-500/[0.06] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[15px]">logout</span>
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
