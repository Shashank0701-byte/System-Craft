export function Header() {
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
      </div>
    </header>
  );
}
