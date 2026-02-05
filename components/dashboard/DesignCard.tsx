interface DesignCardProps {
  title: string;
  status: 'DRAFT' | 'REVIEWED' | 'COMPLETED';
  editedTime: string;
  imageUrl: string;
  reviewers?: boolean;
}

export function DesignCard({ title, status, editedTime, imageUrl, reviewers }: DesignCardProps) {
  const statusColor = {
    'DRAFT': 'bg-slate-100 text-slate-600 dark:bg-surface-highlight-dark dark:text-text-muted-dark',
    'REVIEWED': 'bg-primary/10 text-primary border border-primary/20',
    'COMPLETED': 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400'
  }[status];

  return (
    <div className="group flex flex-col rounded-xl bg-white dark:bg-dashboard-card border border-slate-200 dark:border-transparent hover:border-primary/30 dark:hover:border-primary/50 hover:shadow-xl dark:hover:shadow-primary/5 transition-all overflow-hidden cursor-pointer">
      <div className="h-40 w-full bg-slate-100 dark:bg-dashboard-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `url("${imageUrl}")` }}></div>
        <div className="absolute top-3 right-3">
          <button className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">{title}</h4>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${statusColor}`}>{status}</span>
        </div>
        <div className="mt-auto flex items-center justify-between text-xs text-slate-400 dark:text-text-card-footer-dark">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>Edited {editedTime}</span>
          </div>
          {reviewers && (
            <div className="flex -space-x-1.5">
              <div className="size-5 rounded-full ring-2 ring-white dark:ring-dashboard-card bg-orange-400" title="Reviewer 1"></div>
              <div className="size-5 rounded-full ring-2 ring-white dark:ring-dashboard-card bg-blue-400" title="Reviewer 2"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
