// Push Notification Utility Functions
// WHY: Centralized logic for sending web push notifications with proper error handling
// WHAT: Uses web-push library to send notifications to subscribed participants

import type { PushSubscription, NotificationType } from '../types';

// Dynamic import for web-push to allow graceful fallback
// WHY: web-push may not be installed yet (requires npm install after adding to package.json)
let webpush: any = null;
let WebPushSubscription: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  webpush = require('web-push');
} catch (error) {
  console.warn('[PUSH] web-push library not installed. Run: npm install');
}

// VAPID Configuration
// WHY: Required for web push API authentication and identification
// WHAT: Configure web-push with VAPID keys from environment variables
//
// To generate VAPID keys, run: npx web-push generate-vapid-keys
// Then add to .env.local:
// NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
// VAPID_PRIVATE_KEY=...
// VAPID_SUBJECT=mailto:your@email.com or https://your-domain.com

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

// Initialize web-push if keys are configured
// WHY: Enable push notifications only when properly configured
if (webpush && vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('[PUSH] Web push configured with VAPID keys');
} else if (!webpush) {
  console.warn(
    '[PUSH] web-push library not installed. Run: npm install'
  );
} else {
  console.warn(
    '[PUSH] VAPID keys not configured. Push notifications will not work. ' +
    'Run: npx web-push generate-vapid-keys'
  );
}

// Check if push notifications are properly configured
// WHY: Allows other code to check before attempting to send notifications
export function isPushConfigured(): boolean {
  return !!(webpush && vapidPublicKey && vapidPrivateKey && vapidSubject);
}

// Get the public VAPID key for client-side subscription
// WHY: Client needs public key to subscribe to push notifications
export function getPublicVapidKey(): string | undefined {
  return vapidPublicKey;
}

// Notification payload structure
// WHY: Standardize notification format across all notification types
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: {
    url?: string; // URL to open when clicked
    type?: NotificationType;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  tag?: string; // Notification tag for grouping/replacing
  renotify?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

// Send notification to a single subscription
// WHY: Core function for sending push notifications with error handling
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  // Check if push is configured
  if (!isPushConfigured()) {
    return {
      success: false,
      error: 'Push notifications not configured (missing VAPID keys)',
    };
  }

  try {
    // Convert our PushSubscription type to web-push format
    // WHY: Adapt our storage format to library's expected format
    const webPushSubscription: any = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    // Send the notification
    // WHY: Deliver notification to user's device via push service
    await webpush.sendNotification(
      webPushSubscription,
      JSON.stringify(payload)
    );

    console.log(`[PUSH] Notification sent to ${subscription.endpoint.substring(0, 50)}...`);

    return { success: true };
  } catch (error: any) {
    console.error('[PUSH] Failed to send notification:', error);

    // Handle specific error cases
    // WHY: Provide actionable error information
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or no longer valid
      // WHY: Caller should remove this subscription from database
      return {
        success: false,
        error: 'Subscription expired or invalid',
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

// Send notification to multiple subscriptions
// WHY: Efficiently send same notification to multiple users/devices
export async function sendBulkPushNotifications(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  expiredSubscriptions: string[]; // Endpoints that should be removed
}> {
  const expiredSubscriptions: string[] = [];
  let succeeded = 0;
  let failed = 0;

  // Send to all subscriptions in parallel with rate limiting
  // WHY: Maximize delivery speed while respecting service limits
  const batchSize = 100; // Send in batches to avoid overwhelming the service
  const batches = [];

  for (let i = 0; i < subscriptions.length; i += batchSize) {
    const batch = subscriptions.slice(i, i + batchSize);
    batches.push(batch);
  }

  for (const batch of batches) {
    const results = await Promise.allSettled(
      batch.map((sub) => sendPushNotification(sub, payload))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        succeeded++;
      } else {
        failed++;
        if (
          result.status === 'fulfilled' &&
          result.value.error?.includes('expired')
        ) {
          expiredSubscriptions.push(batch[index].endpoint);
        }
      }
    });
  }

  console.log(
    `[PUSH] Bulk send complete: ${succeeded} succeeded, ${failed} failed, ${expiredSubscriptions.length} expired`
  );

  return {
    total: subscriptions.length,
    succeeded,
    failed,
    expiredSubscriptions,
  };
}

// Helper to create notification payloads for common notification types
// WHY: Standardize notification format for consistency and branding
export function createNotificationPayload(
  type: NotificationType,
  data: {
    title?: string;
    message?: string;
    gameTitle?: string;
    rewardTitle?: string;
    url?: string;
    customData?: Record<string, any>;
  }
): NotificationPayload {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const icon = `${baseUrl}/icon-192x192.png`;
  const badge = `${baseUrl}/icon-192x192.png`;

  // Construct notification based on type
  // WHY: Provide contextual, actionable notifications for each use case
  switch (type) {
    case 'GAME_INVITE':
      return {
        title: data.title || 'New Game Available!',
        body: data.message || `Try ${data.gameTitle || 'this new game'} and win rewards!`,
        icon,
        badge,
        data: {
          url: data.url || `${baseUrl}/`,
          type,
          ...data.customData,
        },
        tag: 'game-invite',
        requireInteraction: false,
      };

    case 'REWARD_CLAIM':
      return {
        title: data.title || 'Reward Available!',
        body: data.message || `You've earned: ${data.rewardTitle || 'a reward'}`,
        icon,
        badge,
        data: {
          url: data.url || `${baseUrl}/rewards`,
          type,
          ...data.customData,
        },
        tag: 'reward-claim',
        requireInteraction: true,
      };

    case 'NEW_GAME':
      return {
        title: data.title || 'New Game Added!',
        body: data.message || `Check out ${data.gameTitle || 'our latest game'}`,
        icon,
        badge,
        data: {
          url: data.url || `${baseUrl}/`,
          type,
          ...data.customData,
        },
        tag: 'new-game',
      };

    case 'REMINDER':
      return {
        title: data.title || "Don't forget!",
        body: data.message || 'Come back and play to win rewards',
        icon,
        badge,
        data: {
          url: data.url || `${baseUrl}/`,
          type,
          ...data.customData,
        },
        tag: 'reminder',
      };

    case 'ANNOUNCEMENT':
      return {
        title: data.title || 'PlayMass Announcement',
        body: data.message || 'We have something new for you!',
        icon,
        badge,
        data: {
          url: data.url || `${baseUrl}/`,
          type,
          ...data.customData,
        },
        tag: 'announcement',
      };

    case 'CUSTOM':
    default:
      return {
        title: data.title || 'PlayMass',
        body: data.message || 'You have a new notification',
        icon,
        badge,
        data: {
          url: data.url || `${baseUrl}/`,
          type: type || 'CUSTOM',
          ...data.customData,
        },
      };
  }
}
