/**
 * POST /api/user/track
 * General-purpose metric tracking endpoint for client-side events
 * (simulations, reference arch completions, AI reviews, etc.)
 *
 * Body: { event: string; payload?: Record<string, unknown> }
 *
 * This avoids polluting every specific API route with tracking logic
 * for events that originate purely on the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db/mongoose';
import User from '@/src/lib/db/models/User';
import { getAuthenticatedUser } from '@/src/lib/firebase/firebaseAdmin';
import { trackMetric, setMetricIfHigher } from '@/src/lib/achievements/trackMetric';
import type { UnlockedAchievement } from '@/src/lib/achievements/engine';

type TrackEvent =
  | 'simulation_executed'
  | 'simulation_million_rps'
  | 'reference_architecture_completed'
  | 'chaos_constraints_addressed'
  | 'high_availability_design'
  | 'max_nodes_in_design';

interface TrackPayload {
  event: TrackEvent;
  payload?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const authenticatedUser = await getAuthenticatedUser(authHeader);
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as TrackPayload;
    const { event, payload = {} } = body;

    if (!event) {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ firebaseUid: authenticatedUser.uid }).select('_id').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;
    let newlyUnlocked: UnlockedAchievement[] = [];

    switch (event) {
      case 'simulation_executed': {
        const targetRps = typeof payload.targetRps === 'number' ? payload.targetRps : 0;
        const isMillionRps = targetRps >= 1_000_000;
        const patch = {
          simulationsExecuted: 1,
          ...(isMillionRps ? { millionRpsSimulations: 1 } : {}),
        };
        newlyUnlocked = await trackMetric(userId, patch);
        break;
      }

      case 'simulation_million_rps': {
        newlyUnlocked = await trackMetric(userId, { millionRpsSimulations: 1 });
        break;
      }

      case 'reference_architecture_completed': {
        newlyUnlocked = await trackMetric(userId, { referenceArchitecturesCompleted: 1 });
        break;
      }

      case 'chaos_constraints_addressed': {
        const count = typeof payload.count === 'number' ? payload.count : 1;
        newlyUnlocked = await trackMetric(userId, { chaosConstraintsAddressed: count });
        break;
      }

      case 'high_availability_design': {
        newlyUnlocked = await trackMetric(userId, { highAvailabilityDesigns: 1 });
        break;
      }

      case 'max_nodes_in_design': {
        const count = typeof payload.count === 'number' ? payload.count : 0;
        newlyUnlocked = await setMetricIfHigher(userId, 'maxNodesInSingleDesign', count);
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, newlyUnlocked });
  } catch (error) {
    console.error('Error tracking metric:', error);
    return NextResponse.json({ error: 'Failed to track metric' }, { status: 500 });
  }
}
