import mongoose, { Schema, Model, Document, Types } from 'mongoose';

// Canvas node structure
export interface ICanvasNode {
    id: string;
    type: string;
    icon: string;
    x: number;
    y: number;
    label?: string;
}

// Connection between nodes
export interface IConnection {
    id: string;
    from: string;
    to: string;
}

export interface IDesign extends Document {
    userId: Types.ObjectId;
    title: string;
    description?: string;
    status: 'draft' | 'reviewed' | 'completed';
    nodes: ICanvasNode[];
    connections: IConnection[];
    thumbnail?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CanvasNodeSchema = new Schema<ICanvasNode>(
    {
        id: { type: String, required: true },
        type: { type: String, required: true },
        icon: { type: String, required: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        label: { type: String },
    },
    { _id: false }
);

const ConnectionSchema = new Schema<IConnection>(
    {
        id: { type: String, required: true },
        from: { type: String, required: true },
        to: { type: String, required: true },
    },
    { _id: false }
);

const DesignSchema = new Schema<IDesign>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            default: 'Untitled Design',
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['draft', 'reviewed', 'completed'],
            default: 'draft',
        },
        nodes: {
            type: [CanvasNodeSchema],
            default: [],
        },
        connections: {
            type: [ConnectionSchema],
            default: [],
        },
        thumbnail: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
DesignSchema.index({ userId: 1, updatedAt: -1 });

const Design: Model<IDesign> = mongoose.models.Design || mongoose.model<IDesign>('Design', DesignSchema);

export default Design;
