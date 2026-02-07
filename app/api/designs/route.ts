import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import Design from '@/src/lib/db/models/Design';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

// GET: Fetch all designs for authenticated user
export async function GET(request: NextRequest) {
    try {
        // Verify Firebase ID token
        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);

        if (!authenticatedUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Find user by verified Firebase UID
        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Fetch designs for user, sorted by most recently updated
        const designs = await Design.find({ userId: user._id })
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json({
            designs: designs.map((design) => ({
                id: design._id.toString(),
                title: design.title,
                description: design.description,
                status: design.status,
                thumbnail: design.thumbnail,
                nodeCount: (design.nodes || []).length,
                createdAt: design.createdAt,
                updatedAt: design.updatedAt,
            })),
        });
    } catch (error) {
        console.error('Error fetching designs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch designs' },
            { status: 500 }
        );
    }
}

// POST: Create a new design
export async function POST(request: NextRequest) {
    try {
        // Parse body first - return 400 for malformed JSON
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            );
        }
        const { title, description } = body;

        // Verify Firebase ID token
        const authHeader = request.headers.get('Authorization');
        const authenticatedUser = await getAuthenticatedUser(authHeader);

        if (!authenticatedUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Find user by verified Firebase UID
        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Create new design with empty canvas
        const design = await Design.create({
            userId: user._id,
            title: title || 'Untitled Design',
            description: description || '',
            status: 'draft',
            nodes: [],
            connections: [],
        });

        return NextResponse.json({
            success: true,
            design: {
                id: design._id.toString(),
                title: design.title,
                status: design.status,
                createdAt: design.createdAt,
            },
        });
    } catch (error) {
        console.error('Error creating design:', error);
        return NextResponse.json(
            { error: 'Failed to create design' },
            { status: 500 }
        );
    }
}
