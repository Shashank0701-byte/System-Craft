import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | undefined;
let auth: Auth | undefined;

function getFirebaseAdmin() {
    if (!app) {
        const existingApps = getApps();

        if (existingApps.length > 0) {
            app = existingApps[0];
        } else {
            // Initialize with service account credentials
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

            if (serviceAccount) {
                try {
                    const credentials = JSON.parse(serviceAccount);
                    app = initializeApp({
                        credential: cert(credentials),
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    });
                } catch (error) {
                    console.error('Failed to parse Firebase service account:', error);
                    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY');
                }
            } else {
                // Fallback: try to initialize with default credentials (for GCP environments)
                try {
                    app = initializeApp({
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    });
                } catch (error) {
                    console.error('Failed to initialize Firebase Admin:', error);
                    throw new Error('Firebase Admin SDK not configured');
                }
            }
        }

        auth = getAuth(app);
    }

    return { app, auth: auth! };
}

export async function verifyIdToken(token: string) {
    const { auth } = getFirebaseAdmin();
    return auth.verifyIdToken(token);
}

export async function getAuthenticatedUser(authHeader: string | null) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
        return null;
    }

    try {
        const decodedToken = await verifyIdToken(token);
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}
