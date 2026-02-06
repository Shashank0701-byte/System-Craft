import Link from 'next/link';


export function CanvasHeader() {
  return (
    <header className="relative h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-sidebar-bg-dark shrink-0 z-20">
      {/* Left: Logo & Breadcrumb */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-primary dark:text-white group">
          <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>hub</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight hidden md:block">SystemCraft</h2>
        </Link>
        <div className="h-6 w-px bg-slate-200 dark:bg-border-dark hidden md:block"></div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-medium">Projects</span>
          <span className="text-slate-600 dark:text-slate-600">/</span>
          <span className="text-slate-900 dark:text-white font-medium">E-Commerce Architecture</span>
        </div>
      </div>

      {/* Center: Timer */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-3 bg-slate-100 dark:bg-[#2b2839] px-4 py-1.5 rounded-full border border-transparent dark:border-[#3f3b54]">
        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400" style={{ fontSize: '20px' }}>timer</span>
        <span className="font-mono text-lg font-bold text-red-500">34:12</span>
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-0.5">remaining</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button className="hidden md:flex h-9 items-center justify-center rounded-lg px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors shadow-lg shadow-primary/20 cursor-pointer">
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
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD51YGf7jfym8PrgMPCN7m4NF1-y15D1REWvF8uP3qJIqZGnd9xI3HQw0egDULywzOrKpdejE0mSjydJ_AKlFRFdbkQQhxuItKJV-Ar_b_Zw4oI_gEq7Mj8CzSCvc2XCUFxN2k63cvStC9vaFbubUQZEp01Dq_6Tn4lpb_begxZkxUa2pyVxOGR_1KfPld0Q-HsSavdTLyIO6X6HgdfSBAsYrEdIjGDwdbanYjqZhwY_cHaJNZ8uPZQ2dXUu53TQ8zAoLK2r5aOUmD5")' }}
          >
          </div>
          <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-sidebar-bg-dark rounded-full"></div>
        </div>
      </div>
    </header>
  );
}
