export function CreateDesignCard() {
  return (
    <button className="group flex flex-col items-center justify-center min-h-[280px] rounded-xl border-2 border-dashed border-slate-300 dark:border-surface-highlight-dark hover:border-primary/50 dark:hover:border-primary/50 bg-slate-50 dark:bg-dashboard-surface/50 hover:bg-slate-100 dark:hover:bg-dashboard-surface transition-all cursor-pointer w-full">
      <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <span className="material-symbols-outlined text-primary text-[32px]">add</span>
      </div>
      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Create New Design</h4>
      <p className="text-sm text-slate-500 dark:text-text-muted-dark">Start from scratch or use a template</p>
    </button>
  );
}
