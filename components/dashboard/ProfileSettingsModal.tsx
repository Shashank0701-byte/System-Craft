'use client';

import React, { useState } from 'react';
import { useAuth } from '@/src/lib/firebase/AuthContext';
import { updateUserProfile } from '@/src/lib/firebase/auth';
import { authFetch } from '@/src/lib/firebase/authClient';

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Get safe avatar URL
    const getAvatarUrl = () => {
        if (photoURL) {
            try {
                const url = new URL(photoURL);
                if (url.protocol === 'https:') {
                    return photoURL;
                }
            } catch {
                // Invalid URL
            }
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=4725f4&color=fff&size=80`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            // Update Firebase Auth Profile
            await updateUserProfile(displayName, photoURL);

            // Sync with MongoDB using the safe backend wrapper
            const response = await authFetch('/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    displayName,
                    photoURL,
                    // Sending provider again just in case, though usually not needed
                    provider: user?.providerData?.[0]?.providerId || 'password',
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to sync user data');
            }

            setSuccess('Profile updated successfully! Refreshing...');

            // Reload window to reflect the fresh state across context
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err) {
            console.error('Update profile error:', err);
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-dashboard-card w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-border-dark overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-sidebar-bg-dark">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">manage_accounts</span>
                        Profile Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div
                                className="size-20 rounded-full bg-cover bg-center ring-4 ring-primary/20 shadow-lg"
                                style={{ backgroundImage: `url("${getAvatarUrl()}")` }}
                            />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                {success}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email Address <span className="text-slate-400 font-normal">(Read Only)</span>
                            </label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-2 bg-slate-100 dark:bg-black/30 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-white/5 cursor-not-allowed text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="displayName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Display Name
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your display name"
                                disabled={isLoading}
                                className="w-full px-4 py-2 bg-white dark:bg-black/50 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="photoURL" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                Avatar Image URL
                                <span className="text-xs text-slate-400 font-normal">Optional</span>
                            </label>
                            <input
                                id="photoURL"
                                type="url"
                                value={photoURL}
                                onChange={(e) => setPhotoURL(e.target.value)}
                                placeholder="https://example.com/avatar.jpg"
                                disabled={isLoading}
                                className="w-full px-4 py-2 bg-white dark:bg-black/50 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-border-dark mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2.5 text-sm font-bold bg-primary hover:bg-primary/90 text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
