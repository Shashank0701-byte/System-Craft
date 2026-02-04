import {
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    signOut,
    AuthError,
} from "firebase/auth";
import { auth } from "./firebaseClient";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = async () => {
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
