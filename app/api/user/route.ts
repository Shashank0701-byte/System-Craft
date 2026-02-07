import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import User from '@/src/lib/db/models/User';

// POST: Create or update user after Firebase auth
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { firebaseUid, email, displayName, photoURL, provider } = body;

        if (!firebaseUid || !email) {
            return NextResponse.json(
                { error: 'Missing required fields: firebaseUid and email' },
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

// GET: Get user by Firebase UID
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const firebaseUid = searchParams.get('firebaseUid');

        if (!firebaseUid) {
            return NextResponse.json(
                { error: 'Missing firebaseUid parameter' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ firebaseUid });

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
