'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { authFetch } from '@/src/lib/firebase/authClient';
import { Header } from '@/components/dashboard/Header';
import { LevelBanner } from '@/components/dashboard/profile/LevelBanner';
import { ActivityHeatmap } from '@/components/dashboard/profile/ActivityHeatmap';
import { BadgeShowcase, AchievementState } from '@/components/dashboard/profile/BadgeShowcase';
import { SkillProgress } from '@/components/dashboard/profile/SkillProgress';
import { LEVELS } from '@/src/lib/achievements/levels';

interface ProfileData {
    achievements: AchievementState[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metrics: Record<string, any>;
}

export default function ProfilePage() {
    const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth();
    const [data, setData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);

    const fetchProfile = useCallback(async () => {
        if (!user?.uid) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await authFetch('/api/achievements');
            
            if (!response.ok) {
                throw new Error('Failed to fetch profile telemetry');
            }

            const json = await response.json();
            setData({
                achievements: json.achievements || [],
                metrics: json.metrics || {}
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err instanceof Error ? err.message : 'Telemetry offline');
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        if (isAuthenticated && user && !hasFetched.current) {
            hasFetched.current = true;
            fetchProfile();
        }
    }, [isAuthenticated, user, fetchProfile]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#060810]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border border-white/[0.06] border-t-cyan-400 rounded-full animate-spin" />
                    <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Syncing Telemetry…</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const metrics = data?.metrics || {};
    const achievements = data?.achievements || [];
    const levelTitle = LEVELS.find(l => l.level === (metrics.level || 1))?.title || 'Engineer';

    return (
        <div className="flex flex-col w-full bg-[#060810] overflow-hidden h-screen max-h-screen">
            <Header />
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#060810] relative">
                <div className="noise-overlay absolute inset-0 pointer-events-none opacity-40 z-0" />
                
                <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col gap-8 pb-12">
                    
                    {/* Header */}
                    <div>
                        <h1 className="text-xl font-bold font-display tracking-tight text-white/90 uppercase">Engineering Profile</h1>
                        <p className="text-[10px] font-mono tracking-wide text-white/40 uppercase mt-1">
                            System telemetry, progression tracking, and verified competencies.
                        </p>
                    </div>

                    {error ? (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs text-center flex flex-col items-center gap-3">
                            <p>Error loading profile: {error}</p>
                            <button 
                                onClick={fetchProfile}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded cursor-pointer"
                            >
                                Retry Connection
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border border-white/[0.06] border-t-cyan-400 rounded-full animate-spin" />
                            <p className="text-white/30 text-[10px] font-mono tracking-widest uppercase">Aggregating Metrics...</p>
                        </div>
                    ) : (
                        <>
                            <LevelBanner 
                                xp={metrics.totalXP || 0} 
                                level={metrics.level || 1} 
                                title={levelTitle} 
                            />
                            
                            <ActivityHeatmap 
                                heatmap={metrics.activityHeatmap || {}} 
                            />
                            
                            <SkillProgress 
                                metrics={metrics} 
                            />
                            
                            <BadgeShowcase 
                                achievements={achievements} 
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
