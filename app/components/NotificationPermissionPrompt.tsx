'use client';

// Notification Permission Prompt Component
// WHY: Request permission for push notifications in a user-friendly way
// WHAT: Shows contextual prompt explaining benefits before requesting permission

import { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationPermissionPromptProps {
  participantId?: string;
  onSuccess?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function NotificationPermissionPrompt({
  participantId,
  onSuccess,
  onDismiss,
  className = '',
}: NotificationPermissionPromptProps) {
  const { isSupported, permission, isSubscribed, isLoading, subscribe } =
    usePushNotifications(participantId);
  const [isVisible, setIsVisible] = useState(true);

  // Handle enable notifications
  // WHY: Request permission and subscribe to push
  const handleEnable = async () => {
    const success = await subscribe();

    if (success) {
      setIsVisible(false);
      onSuccess?.();
    }
  };

  // Handle dismiss
  // WHY: Allow users to opt out
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Don't show if:
  // - Not supported
  // - Permission already granted and subscribed
  // - Permission denied
  // - User dismissed
  if (
    !isVisible ||
    !isSupported ||
    isSubscribed ||
    permission === 'denied' ||
    !participantId
  ) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Stay Updated!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Get notified about new games, rewards, and special offers.
            </p>

            {/* Benefits */}
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                New game alerts
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Reward reminders
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Exclusive offers
              </li>
            </ul>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
