'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { Header } from '@/components/dashboard/Header';
import { Hero } from '@/components/dashboard/Hero';
import { DesignCard } from '@/components/dashboard/DesignCard';
import { CreateDesignCard } from '@/components/dashboard/CreateDesignCard';

interface Design {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'reviewed' | 'completed';
  thumbnail?: string;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const hasFetched = useRef(false);

  // Fetch designs with authenticated request
  const fetchDesigns = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setIsLoadingDesigns(true);
      setError(null);

      const response = await authFetch('/api/designs');

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch designs');
      }

      const data = await response.json();
      setDesigns(data.designs || []);
    } catch (err) {
      console.error('Error fetching designs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load designs');
    } finally {
      setIsLoadingDesigns(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (isAuthenticated && user && !hasFetched.current) {
      hasFetched.current = true;
      fetchDesigns();
    }
  }, [isAuthenticated, user, fetchDesigns]);

  // Create new design with authenticated request
  const handleCreateDesign = async () => {
    if (!user?.uid || isCreating) return;

    try {
      setIsCreating(true);
      setError(null);

      const response = await authFetch('/api/designs', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Untitled Design',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create design');
      }

      const data = await response.json();
      // Redirect to the new design canvas
      router.push(`/canvas/${data.design.id}`);
    } catch (err) {
      console.error('Error creating design:', err);
      setError(err instanceof Error ? err.message : 'Failed to create design');
      setIsCreating(false);
    }
  };

  // Delete design with authenticated request
  const handleDeleteDesign = async (designId: string) => {
    if (!user?.uid) {
      setError('You must be logged in to delete designs');
      throw new Error('Not authenticated');
    }

    try {
      const response = await authFetch(`/api/designs/${designId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete design');
      }

      // Remove from local state
      setDesigns(prev => prev.filter(d => d.id !== designId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete design';
      setError(message);
      throw err; // Re-throw so DesignCard knows deletion failed
    }
  };

  // Format relative time - handles invalid and future dates
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);

    // Handle invalid dates
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Handle future dates
    if (diffMs < 0) {
      return 'Just now';
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <Hero userName={user?.displayName?.split(' ')[0] || 'Designer'} />

          {/* Recent Designs Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Designs</h3>
              <p className="text-sm text-slate-500 dark:text-text-muted-dark">
                {designs.length === 0
                  ? 'Create your first system architecture diagram'
                  : 'Manage and organize your architecture diagrams'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-dashboard-card rounded-lg p-1">
                <button className="p-1.5 rounded bg-white dark:bg-surface-highlight-dark text-primary shadow-sm cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button className="p-1.5 rounded text-slate-500 dark:text-text-muted-dark hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">view_list</span>
                </button>
              </div>
              <select className="h-9 rounded-lg border-none bg-slate-100 dark:bg-dashboard-card text-sm text-slate-700 dark:text-text-input-dark focus:ring-primary focus:outline-none px-2 cursor-pointer">
                <option>Last Edited</option>
                <option>Name (A-Z)</option>
                <option>Status</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
              <button
                onClick={() => { setError(null); hasFetched.current = false; fetchDesigns(); }}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoadingDesigns ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <CreateDesignCard onClick={handleCreateDesign} isLoading={isCreating} />
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-xl bg-dashboard-card animate-pulse" />
              ))}
            </div>
          ) : (
            /* Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <CreateDesignCard onClick={handleCreateDesign} isLoading={isCreating} />
              {designs.map((design) => (
                <DesignCard
                  key={design.id}
                  id={design.id}
                  title={design.title}
                  status={design.status.toUpperCase() as 'DRAFT' | 'REVIEWED' | 'COMPLETED'}
                  editedTime={formatRelativeTime(design.updatedAt)}
                  imageUrl={design.thumbnail}
                  nodeCount={design.nodeCount}
                  onDelete={handleDeleteDesign}
                />
              ))}

              {/* Empty State */}
              {designs.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">architecture</span>
                  <h4 className="text-lg font-medium text-slate-400 mb-2">No designs yet</h4>
                  <p className="text-sm text-slate-500 max-w-md">
                    Click &quot;Create New Design&quot; to start building your first system architecture diagram.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
