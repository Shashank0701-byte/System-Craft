import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Build Firebase config with literal string access (required for Next.js client-side)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase config at runtime
const missingVars = Object.entries(firebaseConfig)
    .filter(([, value]) => !value || value === "")
    .map(([key]) => key);

if (missingVars.length > 0) {
    throw new Error(
        `Missing required Firebase config values: ${missingVars.join(", ")}\n\nPlease check your .env file has all NEXT_PUBLIC_FIREBASE_* variables set.`
    );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
