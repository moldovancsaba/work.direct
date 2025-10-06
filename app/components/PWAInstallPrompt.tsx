'use client';

// PWA Install Prompt Component
// WHY: Encourages users to install the app for better UX and engagement
// WHAT: Shows prompt when app is installable and user hasn't dismissed it

import { useState, useEffect } from 'react';
import { usePWAInstall } from './PWAInstaller';

interface PWAInstallPromptProps {
  autoShow?: boolean; // Show automatically when installable
  delay?: number; // Delay before showing (ms)
  className?: string;
}

export default function PWAInstallPrompt({ 
  autoShow = true, 
  delay = 3000,
  className = '' 
}: PWAInstallPromptProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show prompt automatically after delay
  // WHY: Give user time to explore app before prompting
  useEffect(() => {
    if (!autoShow || !isInstallable || isInstalled || isDismissed) {
      return;
    }

    // Check if user previously dismissed
    // WHY: Don't annoy users who already said no
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      // WHY: User might change their mind after using the app
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [autoShow, delay, isInstallable, isInstalled, isDismissed]);

  // Handle install button click
  // WHY: Trigger browser's native install prompt
  const handleInstall = async () => {
    const installed = await promptInstall();
    
    if (installed) {
      setIsVisible(false);
      localStorage.removeItem('pwa-install-dismissed');
    }
  };

  // Handle dismiss
  // WHY: Allow users to opt out of install prompt
  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't render if not visible or already installed
  if (!isVisible || isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
        {/* Icon */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
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
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Install PlayMass
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Add to your home screen for quick access and offline play!
            </p>

            {/* Benefits */}
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Works offline
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Faster loading
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Get notifications
              </li>
            </ul>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium rounded-lg transition-colors text-sm"
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
