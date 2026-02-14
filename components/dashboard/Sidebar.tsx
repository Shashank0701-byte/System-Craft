import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-white dark:bg-sidebar-bg-dark border-r border-slate-200 dark:border-border-dark">
      <div className="p-4 flex items-center gap-3">
        <div className="bg-primary/20 flex items-center justify-center rounded-lg size-10 text-primary">
          <span className="material-symbols-outlined">hub</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold leading-none tracking-tight">SystemCraft</h1>
          <p className="text-slate-500 dark:text-text-muted-dark text-xs font-mono mt-1">v1.2.0-beta</p>
        </div>
      </div>
      <div className="px-4 py-2">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-medium text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Design
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        <Link href="#" className="flex items-center gap-3 rounded-lg bg-slate-100 dark:bg-dashboard-card px-3 py-2 text-sm font-medium text-primary dark:text-white">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
          My Designs
        </Link>
        <Link href="/interview" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-dashboard-card hover:text-slate-900 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined">play_circle</span>
          Interview Mode
        </Link>
        <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-dashboard-card hover:text-slate-900 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined">library_books</span>
          Templates
        </Link>
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-text-label-dark">System</p>
        </div>
        <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-dashboard-card hover:text-slate-900 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>
      </nav>
    </aside>
  );
}
