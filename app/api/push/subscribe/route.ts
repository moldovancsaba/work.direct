// API Route: POST /api/push/subscribe
// WHY: Enables users to subscribe to push notifications for engagement
// WHAT: Saves push subscription to participant's record in database

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import Participant from '../../../lib/models/Participant';
import type { PushSubscription } from '../../../types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, subscription } = body;

    // Validate required fields
    // WHY: Ensure we have minimum data needed to send notifications
    if (!participantId || !subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Build push subscription object
    // WHY: Standardize subscription format for storage and use
    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userAgent: request.headers.get('user-agent') || undefined,
      subscribedAt: new Date(),
      isActive: true,
    };

    // Find participant and add subscription
    // WHY: Store subscription for future push notifications
    const participant = await Participant.findById(participantId);

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Initialize pushSubscriptions array if not exists
    // WHY: Support backward compatibility with existing participants
    if (!participant.pushSubscriptions) {
      participant.pushSubscriptions = [];
    }

    // Check if subscription already exists
    // WHY: Avoid duplicate subscriptions for same endpoint
    const existingIndex = participant.pushSubscriptions.findIndex(
      (sub: any) => sub.endpoint === pushSubscription.endpoint
    );

    if (existingIndex >= 0) {
      // Update existing subscription
      // WHY: Refresh keys and metadata for existing endpoint
      participant.pushSubscriptions[existingIndex] = {
        ...participant.pushSubscriptions[existingIndex],
        ...pushSubscription,
        lastUsedAt: new Date(),
      };
    } else {
      // Add new subscription
      // WHY: Support multiple devices/browsers per participant
      participant.pushSubscriptions.push(pushSubscription);
    }

    // Save to database
    await participant.save();

    console.log(`[PUSH] Subscription saved for participant ${participantId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
    });
  } catch (error: any) {
    console.error('[PUSH] Subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save subscription',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// API Route: DELETE /api/push/subscribe
// WHY: Allow users to unsubscribe from push notifications
// WHAT: Removes or deactivates push subscription from participant's record

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, endpoint } = body;

    // Validate required fields
    if (!participantId || !endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find participant and remove subscription
    const participant = await Participant.findById(participantId);

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Filter out the subscription
    // WHY: Remove specific device/browser subscription
    if (participant.pushSubscriptions) {
      participant.pushSubscriptions = participant.pushSubscriptions.filter(
        (sub: any) => sub.endpoint !== endpoint
      );
      await participant.save();
    }

    console.log(`[PUSH] Subscription removed for participant ${participantId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription removed successfully',
    });
  } catch (error: any) {
    console.error('[PUSH] Unsubscribe error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove subscription',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
