'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/firebase/AuthContext';
import { logout } from '@/src/lib/firebase/auth';
import { useSidebar } from './SidebarContext';
import { ProfileSettingsModal } from './ProfileSettingsModal';

export function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const { toggle } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Command palette state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  // Toggle Command Palette with keyboard shortcut (⌘K or Ctrl K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setIsDropdownOpen(false);
    }
  };

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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=060810&color=fff&size=40`;
  };

  // Mock list of workspace search items for the command palette
  const commandItems = [
    { label: 'Provision Sandbox Environment', category: 'Topology Actions', icon: 'add_box', shortcut: '⌘ N', action: () => router.push('/dashboard') },
    { label: 'Launch Practice Simulation', category: 'Sandbox Actions', icon: 'play_circle', shortcut: '⌘ P', action: () => router.push('/practice') },
    { label: 'Run Interview Assessment', category: 'Simulation Actions', icon: 'workspace_premium', shortcut: '⌘ I', action: () => router.push('/interview') },
    { label: 'System Analytics Monitor', category: 'observability', icon: 'bar_chart', shortcut: '⌘ A', action: () => router.push('/dashboard/analytics') },
    { label: 'Workspace Profile Settings', category: 'configuration', icon: 'settings', shortcut: '⌘ S', action: () => setIsProfileModalOpen(true) },
  ];

  const filteredCommands = commandItems.filter(item => 
    item.label.toLowerCase().includes(paletteSearch.toLowerCase()) || 
    item.category.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  return (
    <>
      <header className="h-14 flex-shrink-0 border-b border-white/[0.04] bg-[#060810] flex items-center justify-between px-4 md:px-6 z-40 relative select-none">
        <div className="flex items-center gap-3 w-full md:w-1/3">
          {/* Hamburger toggle (mobile only) */}
          <button
            onClick={toggle}
            className="md:hidden flex-shrink-0 p-2 -ml-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.02] transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          
          {/* Command-oriented Search Box (clicks open the command palette) */}
          <div 
            onClick={() => setIsPaletteOpen(true)}
            className="relative w-full max-w-sm group cursor-pointer"
          >
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-white/50 transition-colors material-symbols-outlined text-[17px] select-none">
              search
            </span>
            <div className="w-full h-8.5 rounded-lg border border-white/[0.05] bg-white/[0.02] pl-10 pr-12 text-xs text-white/30 flex items-center select-none">
              Search workspaces, command shortcuts...
            </div>
            {/* Command K indicator */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.03] pointer-events-none">
              <span className="text-[9px] font-mono text-white/20 tracking-wider">⌘</span>
              <span className="text-[9px] font-mono text-white/20 tracking-wider">K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <button className="size-8.5 flex items-center justify-center rounded-lg border border-transparent hover:border-white/[0.04] hover:bg-white/[0.02] text-white/40 hover:text-white/80 transition-all relative cursor-pointer group">
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]"></span>
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 p-0.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer border border-transparent hover:border-white/[0.04]"
            >
              <div
                className="size-7 rounded-lg bg-cover bg-center ring-1 ring-white/[0.08]"
                style={{ backgroundImage: `url("${getAvatarUrl()}")` }}
              />
              <span className="material-symbols-outlined text-white/30 text-[16px]">
                {isDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-[#0c0d16] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/[0.06] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* User Info */}
                <div className="p-4 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-9 rounded-lg bg-cover bg-center ring-1 ring-white/[0.08]"
                      style={{ backgroundImage: `url("${getAvatarUrl()}")` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 truncate font-display">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-[10px] font-mono text-white/30 truncate mt-0.5">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-3 rounded-lg text-left text-xs font-mono uppercase tracking-wider text-white/50 hover:bg-white/[0.02] hover:text-white/80 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">settings</span>
                    <span>Settings</span>
                  </button>
                  <button className="w-full px-3 py-2 flex items-center gap-3 rounded-lg text-left text-xs font-mono uppercase tracking-wider text-white/50 hover:bg-white/[0.02] hover:text-white/80 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">help</span>
                    <span>Help & Support</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-white/[0.04] p-1.5">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-3 py-2 flex items-center gap-3 rounded-lg text-left text-xs font-mono uppercase tracking-wider text-red-400 hover:bg-red-500/[0.06] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Workspace Command Palette Modal */}
      {isPaletteOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center z-50 pt-24 px-4 select-none"
          onClick={() => setIsPaletteOpen(false)}
        >
          <div 
            ref={paletteRef}
            className="w-full max-w-lg rounded-xl border border-white/[0.07] bg-[#0c0d16]/95 p-4 shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative animate-in fade-in slide-in-from-top-4 duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            
            {/* Palette search input */}
            <div className="relative flex items-center border-b border-white/[0.04] pb-3 mb-3">
              <span className="material-symbols-outlined text-white/40 absolute left-1 text-[20px]">search</span>
              <input
                autoFocus
                className="w-full pl-9 pr-6 bg-transparent text-sm text-white placeholder-white/20 focus:outline-none"
                placeholder="Type a workspace command or category..."
                type="text"
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
              />
              <span className="text-[9px] font-mono text-white/20 border border-white/[0.08] px-1.5 py-0.5 rounded bg-white/[0.02]">ESC</span>
            </div>

            {/* Results list */}
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-4">
              <div className="space-y-1">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsPaletteOpen(false);
                        item.action();
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-mono uppercase tracking-wider text-white/50 hover:bg-white/[0.03] hover:text-white/90 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] border border-transparent hover:border-white/[0.04] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[17px] text-white/30 group-hover:text-cyan-400 transition-colors">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-white/20 bg-white/[0.02] border border-white/[0.06] px-1 rounded uppercase tracking-wider">{item.category}</span>
                        <span className="text-[9px] text-white/20 font-mono">{item.shortcut}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-[10px] font-mono text-white/20">
                    NO WORKSPACE COMMANDS MATCHING SEARCH QUERY
                  </div>
                )}
              </div>
            </div>

            {/* Footer keybinding hints */}
            <div className="border-t border-white/[0.04] pt-3.5 mt-3 flex items-center justify-between text-[8px] font-mono tracking-widest text-white/20 uppercase">
              <span>↑↓ navigation</span>
              <span>⏎ execute</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
