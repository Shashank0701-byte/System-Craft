'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';

export function Sidebar() {
  const { isOpen, close } = useSidebar();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'My Designs', icon: 'grid_view', filled: true },
    { href: '/interview', label: 'Interview Mode', icon: 'play_circle', filled: false },
    { href: '#', label: 'Templates', icon: 'library_books', filled: false },
  ];

  const isActive = (href: string) => {
    if (href === '#') return false;
    if (href === '/dashboard') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarContent = (
    <>
      <div className="p-4 flex items-center gap-3">
        <div className="bg-primary/20 flex items-center justify-center rounded-lg size-10 text-primary">
          <span className="material-symbols-outlined">hub</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold leading-none tracking-tight">SystemCraft</h1>
          <p className="text-slate-500 dark:text-text-muted-dark text-xs font-mono mt-1">v1.2.0-beta</p>
        </div>
        {/* Close button (mobile only) */}
        <button
          onClick={close}
          className="md:hidden ml-auto p-1.5 rounded-lg hover:bg-dashboard-card text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close sidebar"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="px-4 py-2">
        <Link
          href="/dashboard"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-medium text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Design
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive(item.href)
              ? 'bg-slate-100 dark:bg-dashboard-card text-primary dark:text-white'
              : 'text-slate-600 dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-dashboard-card hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span
              className="material-symbols-outlined"
              style={item.filled && isActive(item.href) ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-text-label-dark">System</p>
        </div>
        <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-dashboard-card hover:text-slate-900 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (always visible) */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-white dark:bg-sidebar-bg-dark border-r border-slate-200 dark:border-border-dark">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (overlay) */}
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
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white dark:bg-sidebar-bg-dark border-r border-slate-200 dark:border-border-dark shadow-2xl animate-slide-in-left">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
