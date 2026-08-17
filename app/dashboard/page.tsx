'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { Header } from '@/components/dashboard/Header';
import { Hero } from '@/components/dashboard/Hero';
import { DesignCard } from '@/components/dashboard/DesignCard';
import { CreateDesignCard } from '@/components/dashboard/CreateDesignCard';
import { DesignCardSkeleton } from '@/components/ui/Skeleton';

interface Design {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'reviewed' | 'completed';
  thumbnail?: string;
  nodeCount: number;
  connectionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsData {
  totalInterviews: number;
  averageScore: number;
  bestScore: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [systemOk, setSystemOk] = useState(true);
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

  // Fetch real database-backed interview analytics
  const fetchAnalytics = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const response = await authFetch('/api/user/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics({
          totalInterviews: data.totalInterviews ?? 0,
          averageScore: data.averageScore ?? 0,
          bestScore: data.bestScore ?? 0,
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, [user?.uid]);

  // Fetch server health status
  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setSystemOk(data.status === 'ok');
      }
    } catch (err) {
      console.error('Error fetching health status:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && !hasFetched.current) {
      hasFetched.current = true;
      fetchDesigns();
      fetchAnalytics();
      fetchHealth();
    }
  }, [isAuthenticated, user, fetchDesigns, fetchAnalytics, fetchHealth]);

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
      throw err;
    }
  };

  // Format relative time - handles invalid and future dates
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Unknown';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

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

  // Calculate compact telemetry KPIs with SVG sparklines
  const kpis = useMemo(() => {
    const totalArchitectures = designs.length;
    const completedArchitectures = designs.filter(d => d.status === 'completed').length;
    
    const totalSimulations = analytics?.totalInterviews ?? 0;
    const avgScore = analytics?.averageScore ?? 0;

    let recentEdit = 'NO ACTIVE SESSION';
    if (totalArchitectures > 0) {
      const sorted = [...designs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      recentEdit = formatRelativeTime(sorted[0].updatedAt).toUpperCase();
    }

    return [
      { 
        label: 'Architectures', 
        value: `${totalArchitectures} Topologies`, 
        detail: `${completedArchitectures} Completed`,
        sparkline: "M0,10 L10,12 L20,8 L30,14 L40,6 L50,11 L60,9 L70,15 L80,5 L90,12 L100,8",
        color: "text-cyan-400"
      },
      { 
        label: 'Simulations', 
        value: `${totalSimulations} Run`, 
        detail: 'Chaos Engine Active',
        sparkline: "M0,15 L15,10 L30,12 L45,5 L60,14 L75,8 L90,11 L100,6",
        color: "text-indigo-400"
      },
      { 
        label: 'Avg Score Rate', 
        value: totalSimulations > 0 ? `${avgScore}% Score` : '0% Score', 
        detail: 'Based on validations',
        sparkline: "M0,14 L10,12 L20,13 L30,9 L40,11 L50,7 L60,8 L70,5 L80,6 L90,3 L100,4",
        color: "text-emerald-400"
      },
      { 
        label: 'Recent Activity', 
        value: recentEdit, 
        detail: 'Console telemetry log',
        sparkline: "M0,10 L20,10 L30,15 L40,2 L50,18 L60,10 L80,10 L90,12 L100,8",
        color: "text-cyan-400"
      },
      { 
        label: 'Workspace Health', 
        value: systemOk ? '100% Active' : 'DEGRADED', 
        detail: systemOk ? 'Region Mumbai Online' : 'Redis Check failed',
        sparkline: "M0,10 L10,10 L20,10 L30,10 L40,10 L50,10 L60,10 L70,10 L80,10 L90,10 L100,10",
        color: systemOk ? "text-emerald-400" : "text-rose-400"
      },
    ];
  }, [designs, analytics, systemOk]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060810]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border border-white/[0.06] border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Initializing access…</p>
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
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#060810]">
        <div className="max-w-[1400px] mx-auto select-none">
          {/* Noise background */}
          <div className="noise-overlay absolute inset-0 pointer-events-none opacity-40" />

          {/* Operational overview header */}
          <Hero 
            userName={user?.displayName?.split(' ')[0] || 'Designer'} 
            onCreateDesign={handleCreateDesign}
            isCreating={isCreating}
          />

          {/* Telemetry KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {kpis.map((kpi, idx) => (
              <div 
                key={idx} 
                className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-[#0c0d16]/20 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
              >
                {/* Micro outline glow */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="block text-[8px] font-mono tracking-[0.25em] uppercase text-white/20 mb-1.5">{kpi.label}</span>
                    <span className="block text-sm font-bold text-white/80 tracking-tight font-display">{kpi.value}</span>
                  </div>
                  
                  {/* Subtle Sparkline Chart */}
                  <svg className={`w-14 h-5 opacity-45 shrink-0 ${kpi.color}`} viewBox="0 0 100 20">
                    <path d={kpi.sparkline} fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                
                <span className="block text-[9px] font-mono tracking-wide text-white/40 mt-2">{kpi.detail}</span>
              </div>
            ))}
          </div>

          {/* Recent Designs Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-4">
            <div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-white/95 uppercase">TOPOLOGY INDEX</h3>
              <p className="text-[10px] font-mono tracking-wide text-white/30">
                {designs.length === 0
                  ? 'No architectures provisioned inside sandbox'
                  : 'Manage and coordinate simulated topology engines'
                }
              </p>
            </div>
            
            {/* Layout controls */}
            <div className="flex items-center gap-2.5 font-mono text-[9px] uppercase tracking-wider">
              <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.04] rounded-lg p-1">
                <button className="p-1 rounded bg-white/[0.04] border border-white/[0.04] text-cyan-400 cursor-pointer">
                  <span className="material-symbols-outlined text-[16px] block">grid_view</span>
                </button>
                <button className="p-1 rounded text-white/30 hover:text-white/60 transition-colors cursor-pointer border border-transparent">
                  <span className="material-symbols-outlined text-[16px] block">view_list</span>
                </button>
              </div>
              <select className="h-8.5 rounded-lg border border-white/[0.05] bg-white/[0.02] text-[10px] font-mono text-white/60 focus:ring-0 focus:outline-none px-2.5 cursor-pointer uppercase tracking-wider">
                <option className="bg-[#0c0d16]">Last Edited</option>
                <option className="bg-[#0c0d16]">Name (A-Z)</option>
                <option className="bg-[#0c0d16]">Status</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs text-center flex items-center justify-center gap-2">
              <span>Error log: {error}</span>
              <button
                onClick={() => { setError(null); hasFetched.current = false; fetchDesigns(); }}
                className="underline hover:no-underline font-semibold"
              >
                RETRY
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoadingDesigns ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <CreateDesignCard onClick={handleCreateDesign} isLoading={isCreating} />
              {[1, 2, 3].map((i) => (
                <DesignCardSkeleton key={i} />
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
                  nodeCount={design.nodeCount}
                  connectionCount={design.connectionCount}
                  onDelete={handleDeleteDesign}
                />
              ))}

              {/* Empty State */}
              {designs.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/[0.05] rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-white/10 mb-4 select-none">architecture</span>
                  <h4 className="text-xs font-mono font-bold tracking-wider text-white/40 mb-1">NO ACTIVE TOPOLOGY ARCHIVES</h4>
                  <p className="text-[10px] font-mono text-white/20 max-w-sm">
                    Provision your first sandbox environment to establish simulated node clusters.
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
