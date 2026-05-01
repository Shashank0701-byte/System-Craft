"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebaseClient";
import { getRedirectResult } from "./auth";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            Promise.resolve().then(() => setIsLoading(false));
            return;
        }

        // Handle redirect result (popup-blocked fallback)
        getRedirectResult(auth).then(async (result) => {
            if (result?.user) {
                // Sync the redirect-returned user with DB
                try {
                    const token = await result.user.getIdToken();
                    await fetch('/api/user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ displayName: result.user.displayName, photoURL: result.user.photoURL, provider: 'google' }),
                    });
                } catch {
                    // best-effort sync
                }
            }
        }).catch(() => {
            // no redirect result — normal flow
        });

        return onAuthStateChanged(auth, (u) => {
            setUser(u);
            setIsLoading(false);
        });
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
