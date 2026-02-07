import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

// POST: Create or update user after Firebase auth
export async function POST(request: NextRequest) {
    try {
        // Verify Firebase ID token from Authorization header
        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);

        if (!authenticatedUser) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid or missing token' },
                { status: 401 }
            );
        }

        await dbConnect();

        const body = await request.json();
        const { displayName, photoURL, provider } = body;

        // Use UID from verified token, not from request body
        const firebaseUid = authenticatedUser.uid;
        const email = authenticatedUser.email;

        if (!email) {
            return NextResponse.json(
                { error: 'Email not found in token' },
                { status: 400 }
            );
        }

        // Find and update or create user
        const user = await User.findOneAndUpdate(
            { firebaseUid },
            {
                firebaseUid,
                email,
                displayName: displayName || email.split('@')[0],
                photoURL,
                provider: provider || 'google',
                lastLoginAt: new Date(),
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                plan: user.plan,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Error syncing user:', error);
        return NextResponse.json(
            { error: 'Failed to sync user' },
            { status: 500 }
        );
    }
}

// GET: Get current authenticated user
export async function GET(request: NextRequest) {
    try {
        // Verify Firebase ID token from Authorization header
        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);

        if (!authenticatedUser) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid or missing token' },
                { status: 401 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                plan: user.plan,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}
