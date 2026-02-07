import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { isValidObjectId } from '@/src/lib/db/mongoose';
import Design from '@/src/lib/db/models/Design';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';

// Valid status values
const VALID_STATUSES = ['draft', 'reviewed', 'completed'] as const;

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Fetch a specific design
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            return NextResponse.json(
                { error: 'Invalid design ID format' },
                { status: 400 }
            );
        }

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

        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const design = await Design.findOne({ _id: id, userId: user._id });
        if (!design) {
            return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }

        return NextResponse.json({
            design: {
                id: design._id.toString(),
                title: design.title,
                description: design.description,
                status: design.status,
                nodes: design.nodes,
                connections: design.connections,
                thumbnail: design.thumbnail,
                createdAt: design.createdAt,
                updatedAt: design.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error fetching design:', error);
        return NextResponse.json(
            { error: 'Failed to fetch design' },
            { status: 500 }
        );
    }
}

// PUT: Update a design (auto-save)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            return NextResponse.json(
                { error: 'Invalid design ID format' },
                { status: 400 }
            );
        }

        // Parse body before dbConnect - return 400 for malformed JSON
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            );
        }
        const { title, description, status, nodes, connections, thumbnail } = body;

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

        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Validate status if provided
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (nodes !== undefined) updateData.nodes = nodes;
        if (connections !== undefined) updateData.connections = connections;
        if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

        const design = await Design.findOneAndUpdate(
            { _id: id, userId: user._id },
            { $set: updateData },
            { new: true }
        );

        if (!design) {
            return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            design: {
                id: design._id.toString(),
                title: design.title,
                status: design.status,
                updatedAt: design.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error updating design:', error);
        return NextResponse.json(
            { error: 'Failed to update design' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a design
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            return NextResponse.json(
                { error: 'Invalid design ID format' },
                { status: 400 }
            );
        }

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

        const user = await User.findOne({ firebaseUid: authenticatedUser.uid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const design = await Design.findOneAndDelete({ _id: id, userId: user._id });
        if (!design) {
            return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting design:', error);
        return NextResponse.json(
            { error: 'Failed to delete design' },
            { status: 500 }
        );
    }
}
