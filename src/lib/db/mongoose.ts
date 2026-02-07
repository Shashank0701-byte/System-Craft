import mongoose from 'mongoose';

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Add mongoose cache to global
declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
    global.mongooseCache = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
    // Validate at runtime, not at module load time
    const MONGODB_URL = process.env.MONGODB_URL;

    if (!MONGODB_URL) {
        throw new Error('Please define the MONGODB_URL environment variable');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URL, opts).then((mongooseInstance) => {
            console.log('MongoDB connected successfully');
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

// Helper to validate MongoDB ObjectId
export function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id) &&
        new mongoose.Types.ObjectId(id).toString() === id;
}

export default dbConnect;
