import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background-dark py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="size-6 text-slate-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">hub</span>
          </div>
          <span className="text-slate-500 text-sm font-semibold">SystemCraft Inc. © 2024</span>
        </div>
        <div className="flex gap-8">
          <Link href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Privacy</Link>
          <Link href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Terms</Link>
          <Link href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Twitter</Link>
          <Link href="#" className="text-slate-500 hover:text-white text-sm transition-colors">GitHub</Link>
        </div>
      </div>
    </footer>
  );
}
