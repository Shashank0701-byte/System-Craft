import { auth } from './firebaseClient';

/**
 * Get the current user's ID token for API authentication.
 * This token should be sent as Bearer token in Authorization header.
 */
export async function getIdToken(): Promise<string | null> {
    if (!auth?.currentUser) {
        return null;
    }

    try {
        return await auth.currentUser.getIdToken();
    } catch (error) {
        console.error('Error getting ID token:', error);
        return null;
    }
}

/**
 * Create headers with Authorization token for authenticated API requests.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
    const token = await getIdToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Make an authenticated fetch request.
 */
export async function authFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers = await getAuthHeaders();

    return fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });
}
