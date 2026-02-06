"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebaseClient";

// Auth context type that includes loading state
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
            setIsLoading(false);
            return;
        }
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
