import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import Design from '@/src/lib/db/models/Design';
import User from '@/src/lib/db/models/User';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Fetch a specific design
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        await dbConnect();

        const { id } = await params;
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
        await dbConnect();

        const { id } = await params;
        const body = await request.json();
        const { firebaseUid, title, description, status, nodes, connections, thumbnail } = body;

        if (!firebaseUid) {
            return NextResponse.json(
                { error: 'Missing firebaseUid' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
        await dbConnect();

        const { id } = await params;
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
