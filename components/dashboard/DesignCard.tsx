'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface DesignCardProps {
  id: string;
  title: string;
  status: 'DRAFT' | 'REVIEWED' | 'COMPLETED';
  editedTime: string;
  imageUrl?: string;
  reviewers?: boolean;
  nodeCount?: number;
  onDelete?: (id: string) => Promise<void>;
}

export function DesignCard({ id, title, status, editedTime, imageUrl, reviewers, nodeCount, onDelete }: DesignCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusColor = {
    'DRAFT': 'bg-slate-100 text-slate-600 dark:bg-surface-highlight-dark dark:text-text-muted-dark',
    'REVIEWED': 'bg-primary/10 text-primary border border-primary/20',
    'COMPLETED': 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400'
  }[status];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  // Placeholder thumbnail if none provided
  const thumbnailUrl = imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&size=400&background=1e1b2e&color=4725f4&font-size=0.25&bold=true`;

  return (
    <>
      <Link href={`/canvas/${id}`}>
        <div className="group flex flex-col rounded-xl bg-white dark:bg-dashboard-card border border-slate-200 dark:border-transparent hover:border-primary/30 dark:hover:border-primary/50 hover:shadow-xl dark:hover:shadow-primary/5 transition-all overflow-hidden cursor-pointer h-full">
          <div className="h-40 w-full bg-slate-100 dark:bg-dashboard-surface relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity"
              style={{ backgroundImage: `url("${thumbnailUrl}")` }}
            />
            <div className="absolute top-3 right-3" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">more_horiz</span>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-dashboard-card rounded-lg shadow-xl border border-slate-200 dark:border-border-dark overflow-hidden z-50">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Could add rename functionality here
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-highlight-dark transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Could add duplicate functionality here
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-highlight-dark transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    <span>Duplicate</span>
                  </button>
                  <div className="border-t border-slate-200 dark:border-border-dark" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      setIsConfirmOpen(true);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
            {nodeCount !== undefined && nodeCount > 0 && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                {nodeCount} node{nodeCount !== 1 ? 's' : ''}
              </div>
            )}
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
      </Link>

      {/* Delete Confirmation Modal */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            e.preventDefault();
            if (!isDeleting) setIsConfirmOpen(false);
          }}
        >
          <div
            className="bg-white dark:bg-dashboard-card rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-200 dark:border-border-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400">delete</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Design</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">&quot;{title}&quot;</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-highlight-dark rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
