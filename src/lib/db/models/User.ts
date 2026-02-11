import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    provider: 'google' | 'github';
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date;
    plan: 'free' | 'pro' | 'enterprise';
    interviewAttempts: {
        count: number;
        weekStart: Date;
    };
}

const UserSchema = new Schema<IUser>(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        photoURL: {
            type: String,
            default: null,
        },
        provider: {
            type: String,
            enum: ['google', 'github'],
            required: true,
        },
        lastLoginAt: {
            type: Date,
            default: Date.now,
        },
        plan: {
            type: String,
            enum: ['free', 'pro', 'enterprise'],
            default: 'free',
        },
        interviewAttempts: {
            count: { type: Number, default: 0 },
            weekStart: { type: Date, default: Date.now },
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Prevent model overwrite during hot reload
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
