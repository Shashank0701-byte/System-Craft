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
        <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-text-muted-dark hover:bg-slate-100 dark:hover:bg-dashboard-card hover:text-slate-900 dark:hover:text-white transition-colors">
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
      <div className="p-4 border-t border-slate-200 dark:border-border-dark">
        <Link href="#" className="flex items-center gap-3 group">
          <div className="size-9 rounded-full bg-cover bg-center ring-2 ring-slate-200 dark:ring-border-dark group-hover:ring-primary transition-all relative overflow-hidden">
             <div className="w-full h-full bg-slate-300 dark:bg-slate-700" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDsX9HBmAzXRPhf_-WPWua5XtOsw6U54PS1DCQ0vBMMbbzrAc0u3NJor7QBxzVM7I4UvbQEhXN404ASRsP9lBRiW7iKwI4eAtStOuJXzrX0QW01yORmah7iiuJqKs5TYiWWOAJJIwyxuDXVNz6k6Plik6rovlpaQlXmf85lxXB5Up13S7fGO7wROUq0hEIFaOkm-MhPH7pj3i6pFlGXscZ55xBMcIWfMd-XIg_s8Ag8Jg4muIqOOVFGxnooIEQFY9X7N0z3phwwZTmr")' }}></div>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Alex Chen</p>
            <p className="text-xs text-slate-500 dark:text-text-muted-dark">Pro Plan</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
