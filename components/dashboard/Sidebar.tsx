'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { ProfileSettingsModal } from './ProfileSettingsModal';

export function Sidebar() {
  const { isOpen, close } = useSidebar();
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const workspaceItems = [
    { id: 'topologies', href: '/dashboard', label: 'Topologies', icon: 'hub', filled: true },
    { id: 'templates', href: '/practice', label: 'Templates', icon: 'library_books', filled: false },
    { id: 'reference-architectures', href: '/dashboard/reference-architectures', label: 'Reference Archs', icon: 'account_tree', filled: false },
  ];

  const systemItems = [
    { id: 'profile', href: '/dashboard/profile', label: 'Engineer Profile', icon: 'badge', filled: true },
    { id: 'analytics', href: '/dashboard/analytics', label: 'Analytics', icon: 'bar_chart', filled: true },
    { id: 'report-card', href: '/dashboard/report-card', label: 'Performance Report', icon: 'workspace_premium', filled: true },
    { id: 'interview', href: '/interview', label: 'Interview Mode', icon: 'play_circle', filled: false },
  ];

  const isActive = (href: string) => {
    if (href === '#') return false;
    if (href === '/dashboard' || href === '/interview') return pathname === href;
    if (href === '/practice') return pathname === '/practice' || pathname.startsWith('/practice/');
    if (href === '/dashboard/reference-architectures') return pathname.startsWith('/dashboard/reference-architectures');
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Focus management: trap focus, restore on close
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement;

    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href]:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current && triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen]);

  const renderNavItems = (items: typeof workspaceItems) => {
    return items.map((item) => {
      const active = isActive(item.href);
      const classes = `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[10px] font-mono tracking-wider uppercase transition-all duration-200 select-none ${active
        ? 'bg-white/[0.03] text-white/90 border border-white/[0.04]'
        : 'text-white/30 hover:bg-white/[0.01] hover:text-white/60 border border-transparent'
        }`;

      return (
        <Link
          key={item.id}
          href={item.href}
          className={classes}
        >
          <span
            className="material-symbols-outlined text-[15px] opacity-60"
            style={item.filled && active ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
          {item.id === 'templates' && (
            <span className="ml-auto text-[7px] font-mono tracking-widest text-cyan-400 bg-cyan-400/5 px-1 py-0.5 rounded border border-cyan-400/10">NEW</span>
          )}
        </Link>
      );
    });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#060810] border-r border-white/[0.03] relative">
      {/* Noise background */}
      <div className="noise-overlay absolute inset-0 pointer-events-none opacity-20" />

      {/* Header section */}
      <div className="p-4 flex items-center justify-between z-10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded bg-cyan-300/[0.03] text-cyan-300 border border-cyan-300/10">
            <span className="material-symbols-outlined text-[15px]">hub</span>
          </div>
          <div className="flex flex-col">
            <h1 id="sidebar-title" className="text-xs font-bold tracking-tight text-white/90 font-display">SYSTEMCRAFT</h1>
            <p className="text-white/20 text-[8px] font-mono tracking-wider uppercase mt-0.5">Control Panel</p>
          </div>
        </Link>
        {/* Close button (mobile only) */}
        <button
          ref={closeButtonRef}
          onClick={close}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.02] text-white/40 hover:text-white/80 transition-colors cursor-pointer"
          aria-label="Close sidebar"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Scrollable menu content */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 z-10">
        {/* Workspace group */}
        <div className="space-y-1">
          <p className="px-2.5 text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-white/15">Workspace</p>
          <div className="space-y-0.5">
            {renderNavItems(workspaceItems)}
          </div>
        </div>

        {/* System group */}
        <div className="space-y-1">
          <p className="px-2.5 text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-white/15">System</p>
          <div className="space-y-0.5">
            {renderNavItems(systemItems)}
          </div>
        </div>

        {/* Tools group */}
        <div className="space-y-1">
          <p className="px-2.5 text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-white/15">Configuration</p>
          <div className="space-y-0.5">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[10px] font-mono tracking-wider uppercase text-white/30 hover:bg-white/[0.01] hover:text-white/60 border border-transparent transition-all duration-200 select-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] opacity-60">settings</span>
              <span className="text-left">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer session metadata */}
      <div className="p-3.5 border-t border-white/[0.02] flex items-center justify-between text-[7px] font-mono tracking-widest text-white/15 uppercase z-10">
        <span>MUMBAI-1A</span>
        <span>v1.3.2</span>
      </div>

      {/* Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-52 flex-shrink-0 flex-col z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={close}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); } }}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
          {/* Slide-in panel */}
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-title"
            className="md:hidden fixed inset-y-0 left-0 z-50 w-56 flex flex-col shadow-2xl animate-slide-in-left"
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
