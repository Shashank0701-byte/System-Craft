import {
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    signOut,
    AuthError,
    updateProfile,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "./firebaseClient";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

function formatProviderName(method: string): string {
    switch (method) {
        case "google.com":
            return "Google";
        case "github.com":
            return "GitHub";
        case "password":
            return "email and password";
        default:
            return method;
    }
}

async function buildProviderConflictMessage(authError: AuthError, attemptedProvider: "Google" | "GitHub") {
    const email = authError.customData?.email;

    if (!auth || !email) {
        return `An account already exists with this email. Sign in using the original method first, then connect ${attemptedProvider} later.`;
    }

    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);

        if (methods.length === 0) {
            return `An account already exists with this email. Sign in using the original method first, then connect ${attemptedProvider} later.`;
        }

        const formattedMethods = methods.map(formatProviderName).join(" or ");
        return `This email is already registered with ${formattedMethods}. Sign in using ${formattedMethods} first, then connect ${attemptedProvider} later.`;
    } catch {
        return `An account already exists with this email. Sign in using the original method first, then connect ${attemptedProvider} later.`;
    }
}

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
        if (authError.code === "auth/account-exists-with-different-credential") {
            throw new Error(await buildProviderConflictMessage(authError, "Google"));
        }
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
        if (authError.code === "auth/account-exists-with-different-credential") {
            throw new Error(await buildProviderConflictMessage(authError, "GitHub"));
        }
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

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    let createdUser = null;
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        createdUser = res.user;

        try {
            await updateProfile(createdUser, { displayName });
        } catch (profileError) {
            // Rollback: delete the partially created account
            await createdUser.delete();
            throw profileError;
        }

        return createdUser;
    } catch (error) {
        const authError = error as AuthError;
        console.error("Email sign-up error:", {
            code: authError.code,
            message: authError.message,
        });
        if (authError.code === 'auth/email-already-in-use') {
            throw new Error("An account with this email already exists.");
        }
        if (authError.code === 'auth/weak-password') {
            throw new Error("Password must be at least 6 characters.");
        }
        throw new Error(authError.message || "Failed to create account");
    }
};

export const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        return res.user;
    } catch (error) {
        const authError = error as AuthError;
        console.error("Email sign-in error:", {
            code: authError.code,
            message: authError.message,
        });
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
            throw new Error("Invalid email or password.");
        }
        throw new Error(authError.message || "Failed to sign in");
    }
};

export const resetPassword = async (email: string) => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        const authError = error as AuthError;
        console.error("Password reset error:", {
            code: authError.code,
            message: authError.message,
        });
        if (authError.code === 'auth/user-not-found') {
            throw new Error("No account found with this email.");
        }
        throw new Error(authError.message || "Failed to send reset email");
    }
};
