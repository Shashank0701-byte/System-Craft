import {
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import { auth } from "./firebaseClient";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
};

export const signInWithGitHub = async () => {
    const res = await signInWithPopup(auth, githubProvider);
    return res.user;
};

export const logout = async () => {
    await signOut(auth);
};
