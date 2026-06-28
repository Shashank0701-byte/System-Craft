/**
 * UserMetrics Model
 * Tracks every measurable engineering action for a user.
 * The achievement engine reads this to evaluate unlock conditions.
 */

import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IUserMetricsData {
  // Learning
  architecturesCreated: number;
  // Interview performance
  interviewsCompleted: number;
  perfectScores: number;
  highAverageUnlocked: number;       // 0 or 1 — unlocked flag
  consistentPerformerStreak: number; // current streak of 80+ scores
  comebackUnlocked: number;          // 0 or 1 — unlocked flag
  // Infrastructure skills (count of correct AI-reviewed uses)
  cacheImplementations: number;
  loadBalancerImplementations: number;
  databaseImplementations: number;
  messagingImplementations: number;
  cdnImplementations: number;
  apiGatewayImplementations: number;
  faultToleranceImplementations: number;
  securityImplementations: number;
  // Distributed systems concepts
  capTheoremApplications: number;
  eventualConsistencyApplications: number;
  idempotencyApplications: number;
  cqrsApplications: number;
  sagaPatternApplications: number;
  retryStrategyApplications: number;
  serviceDiscoveryApplications: number;
  leaderElectionApplications: number;
  shardingApplications: number;
  replicationApplications: number;
  circuitBreakerApplications: number;
  rateLimitingApplications: number;
  multiRegionDesigns: number;
  // Reliability
  chaosConstraintsAddressed: number;
  highAvailabilityDesigns: number;
  disasterRecoveryDesigns: number;
  zeroDowntimeDeployments: number;
  failoverImplementations: number;
  recoveryMasterRuns: number;
  blackoutRecovered: number;
  // Scalability
  simulationsExecuted: number;
  millionRpsSimulations: number;
  autoScalingEvents: number;
  highThroughputSimulations: number;
  globalInfrastructureDesigns: number;
  // Reference architectures
  referenceArchitecturesCompleted: number;
  // Secret / computed
  maxNodesInSingleDesign: number;
  achievementCategoriesUnlocked: number;
  scalabilityAchievementsCompleted: number;
  highScoreAcrossDifficulties: number; // count of difficulties with 90+ score
  // XP and level
  totalXP: number;
  level: number;
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  // Heatmap data — stored as { 'YYYY-MM-DD': count }
  activityHeatmap: Map<string, number>;
  // Pinned achievement IDs (up to 6)
  pinnedAchievements: string[];
}

export interface IUserMetrics extends Document, IUserMetricsData {
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserMetricsSchema = new Schema<IUserMetrics>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Learning
    architecturesCreated: { type: Number, default: 0, min: 0 },
    // Interview
    interviewsCompleted: { type: Number, default: 0, min: 0 },
    perfectScores: { type: Number, default: 0, min: 0 },
    highAverageUnlocked: { type: Number, default: 0, min: 0, max: 1 },
    consistentPerformerStreak: { type: Number, default: 0, min: 0 },
    comebackUnlocked: { type: Number, default: 0, min: 0, max: 1 },
    // Infrastructure
    cacheImplementations: { type: Number, default: 0, min: 0 },
    loadBalancerImplementations: { type: Number, default: 0, min: 0 },
    databaseImplementations: { type: Number, default: 0, min: 0 },
    messagingImplementations: { type: Number, default: 0, min: 0 },
    cdnImplementations: { type: Number, default: 0, min: 0 },
    apiGatewayImplementations: { type: Number, default: 0, min: 0 },
    faultToleranceImplementations: { type: Number, default: 0, min: 0 },
    securityImplementations: { type: Number, default: 0, min: 0 },
    // Distributed systems
    capTheoremApplications: { type: Number, default: 0, min: 0 },
    eventualConsistencyApplications: { type: Number, default: 0, min: 0 },
    idempotencyApplications: { type: Number, default: 0, min: 0 },
    cqrsApplications: { type: Number, default: 0, min: 0 },
    sagaPatternApplications: { type: Number, default: 0, min: 0 },
    retryStrategyApplications: { type: Number, default: 0, min: 0 },
    serviceDiscoveryApplications: { type: Number, default: 0, min: 0 },
    leaderElectionApplications: { type: Number, default: 0, min: 0 },
    shardingApplications: { type: Number, default: 0, min: 0 },
    replicationApplications: { type: Number, default: 0, min: 0 },
    circuitBreakerApplications: { type: Number, default: 0, min: 0 },
    rateLimitingApplications: { type: Number, default: 0, min: 0 },
    multiRegionDesigns: { type: Number, default: 0, min: 0 },
    // Reliability
    chaosConstraintsAddressed: { type: Number, default: 0, min: 0 },
    highAvailabilityDesigns: { type: Number, default: 0, min: 0 },
    disasterRecoveryDesigns: { type: Number, default: 0, min: 0 },
    zeroDowntimeDeployments: { type: Number, default: 0, min: 0 },
    failoverImplementations: { type: Number, default: 0, min: 0 },
    recoveryMasterRuns: { type: Number, default: 0, min: 0 },
    blackoutRecovered: { type: Number, default: 0, min: 0, max: 1 },
    // Scalability
    simulationsExecuted: { type: Number, default: 0, min: 0 },
    millionRpsSimulations: { type: Number, default: 0, min: 0 },
    autoScalingEvents: { type: Number, default: 0, min: 0 },
    highThroughputSimulations: { type: Number, default: 0, min: 0 },
    globalInfrastructureDesigns: { type: Number, default: 0, min: 0 },
    // Reference
    referenceArchitecturesCompleted: { type: Number, default: 0, min: 0 },
    // Secret / computed
    maxNodesInSingleDesign: { type: Number, default: 0, min: 0 },
    achievementCategoriesUnlocked: { type: Number, default: 0, min: 0 },
    scalabilityAchievementsCompleted: { type: Number, default: 0, min: 0 },
    highScoreAcrossDifficulties: { type: Number, default: 0, min: 0 },
    // XP + level
    totalXP: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    // Streaks
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActivityDate: { type: Date, default: null },
    // Heatmap
    activityHeatmap: { type: Map, of: Number, default: {} },
    // Pinned achievements
    pinnedAchievements: { type: [String], default: [] },
  },
  { timestamps: true }
);

const UserMetrics: Model<IUserMetrics> =
  mongoose.models.UserMetrics ||
  mongoose.model<IUserMetrics>('UserMetrics', UserMetricsSchema);

export default UserMetrics;
