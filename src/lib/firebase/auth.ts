import {
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    signOut,
    AuthError,
    updateProfile,
} from "firebase/auth";
import { auth } from "./firebaseClient";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    try {
        const res = await signInWithPopup(auth, googleProvider);
        return res.user;
    } catch (error) {
        const authError = error as AuthError;
        console.error("Google sign-in error:", {
            code: authError.code,
            message: authError.message,
        });
        throw new Error(authError.message || "Failed to sign in with Google");
    }
};

export const signInWithGitHub = async () => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    try {
        const res = await signInWithPopup(auth, githubProvider);
        return res.user;
    } catch (error) {
        const authError = error as AuthError;
        console.error("GitHub sign-in error:", {
            code: authError.code,
            message: authError.message,
        });
        throw new Error(authError.message || "Failed to sign in with GitHub");
    }
};

export const logout = async () => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    try {
        await signOut(auth);
    } catch (error) {
        const authError = error as AuthError;
        console.error("Logout error:", {
            code: authError.code,
            message: authError.message,
        });
        throw new Error(authError.message || "Failed to log out");
    }
};

export const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    if (!auth || !auth.currentUser) throw new Error("User is not signed in.");
    try {
        await updateProfile(auth.currentUser, {
            ...(displayName && { displayName }),
            ...(photoURL && { photoURL })
        });
        await auth.currentUser.reload();
    } catch (error) {
        const authError = error as AuthError;
        console.error("Profile update error:", {
            code: authError.code,
            message: authError.message,
        });
        throw new Error(authError.message || "Failed to update profile");
    }
};
