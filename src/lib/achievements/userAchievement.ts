/**
 * UserAchievement Model
 * Records which tier of which achievement a user has unlocked, and when.
 * One document per (userId, achievementId, tier) triple.
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import type { AchievementTier } from './definitions';

export interface IUserAchievement extends Document {
  userId: Types.ObjectId;
  achievementId: string;
  tier: AchievementTier;
  unlockedAt: Date;
  xpAwarded: number;
  /** Metric value at the time of unlock — useful for display */
  progressAtUnlock: number;
}

const UserAchievementSchema = new Schema<IUserAchievement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    achievementId: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
    xpAwarded: {
      type: Number,
      required: true,
      min: 0,
    },
    progressAtUnlock: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: false }
);

// Composite unique index — one record per (user, achievement, tier)
UserAchievementSchema.index(
  { userId: 1, achievementId: 1, tier: 1 },
  { unique: true }
);

// Fast lookups: all achievements for a user
UserAchievementSchema.index({ userId: 1, unlockedAt: -1 });

const UserAchievement: Model<IUserAchievement> =
  mongoose.models.UserAchievement ||
  mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);

export default UserAchievement;
