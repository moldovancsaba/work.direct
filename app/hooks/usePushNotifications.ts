'use client';

// Client-side hook for push notification management
// WHY: Provides easy interface for requesting permission and subscribing to push
// WHAT: Handles browser Push API and syncs with backend

import { useState, useEffect } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications(participantId?: string) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: null,
    isSubscribed: false,
    isLoading: false,
    error: null,
  });

  // Check browser support and current permission on mount
  // WHY: Determine if push notifications are available
  useEffect(() => {
    const checkSupport = async () => {
      // Check if service worker and Push API are supported
      // WHY: Progressive enhancement - only enable if browser supports it
      const isSupported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      if (!isSupported) {
        setState((prev) => ({ ...prev, isSupported: false }));
        return;
      }

      // Get current permission status
      const permission = Notification.permission;

      // Check if already subscribed
      // WHY: Show accurate subscription status
      const subscription = await checkExistingSubscription();

      setState({
        isSupported: true,
        permission,
        isSubscribed: !!subscription,
        isLoading: false,
        error: null,
      });
    };

    checkSupport();
  }, []);

  // Check if there's an existing push subscription
  // WHY: Avoid duplicate subscriptions
  async function checkExistingSubscription(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('[PUSH] Error checking subscription:', error);
      return null;
    }
  }

  // Request notification permission from user
  // WHY: Required before subscribing to push notifications
  async function requestPermission(): Promise<boolean> {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Push notifications not supported in this browser',
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const permission = await Notification.requestPermission();

      setState((prev) => ({ ...prev, permission, isLoading: false }));

      return permission === 'granted';
    } catch (error: any) {
      console.error('[PUSH] Permission request failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to request permission',
      }));
      return false;
    }
  }

  // Subscribe to push notifications
  // WHY: Enable receiving push notifications for this user/device
  async function subscribe(): Promise<boolean> {
    if (!participantId) {
      setState((prev) => ({
        ...prev,
        error: 'Participant ID required for subscription',
      }));
      return false;
    }

    // Check permission first
    if (state.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        return false;
      }
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get service worker registration
      // WHY: Service worker is required for push notifications
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Get VAPID public key from environment
        // WHY: Required for subscribing to push service
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!vapidPublicKey) {
          throw new Error('VAPID public key not configured');
        }

        // Convert base64 VAPID key to Uint8Array
        // WHY: Push API requires key in specific format
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

        // Subscribe to push
        // WHY: Get subscription object with endpoint and keys
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true, // Always show notification to user
          applicationServerKey: convertedKey as BufferSource,
        });
      }

      // Send subscription to backend
      // WHY: Store subscription so we can send notifications later
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      console.log('[PUSH] Successfully subscribed to push notifications');
      return true;
    } catch (error: any) {
      console.error('[PUSH] Subscription failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to subscribe',
      }));
      return false;
    }
  }

  // Unsubscribe from push notifications
  // WHY: Allow users to opt-out of notifications
  async function unsubscribe(): Promise<boolean> {
    if (!participantId) {
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push service
        await subscription.unsubscribe();

        // Remove from backend
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId,
            endpoint: subscription.endpoint,
          }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      console.log('[PUSH] Successfully unsubscribed from push notifications');
      return true;
    } catch (error: any) {
      console.error('[PUSH] Unsubscribe failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to unsubscribe',
      }));
      return false;
    }
  }

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

// Helper function to convert base64 string to Uint8Array
// WHY: Push API requires VAPID key in Uint8Array format
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
