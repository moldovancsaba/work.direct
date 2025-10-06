'use client';

// PWA Service Worker Registration and Management Component
// Handles SW registration, updates, and lifecycle events
// WHY: Provides centralized PWA functionality management with user feedback

import { useEffect, useState } from 'react';

interface PWAInstallerProps {
  onUpdateAvailable?: () => void;
  onInstalled?: () => void;
}

export default function PWAInstaller({ onUpdateAvailable, onInstalled }: PWAInstallerProps) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if service workers are supported
    // WHY: Progressive enhancement - only register SW if browser supports it
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Monitor online/offline status
    // WHY: Provides network state awareness for better UX
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register the service worker
  // WHY: Enables offline functionality and caching strategies
  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for SW updates
      });

      setRegistration(reg);

      // Check for updates immediately and then periodically
      // WHY: Ensures users get the latest version promptly
      reg.update();

      // Check for updates every hour
      // WHY: Balance between freshness and network usage
      const updateInterval = setInterval(() => {
        reg.update();
      }, 60 * 60 * 1000);

      // Handle service worker updates
      // WHY: Notify users when new version is available
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed, but old one is still active
              // WHY: Inform user that app update is available
              onUpdateAvailable?.();
            } else if (newWorker.state === 'activated' && !navigator.serviceWorker.controller) {
              // First time service worker activated
              // WHY: Track successful PWA installation
              onInstalled?.();
            }
          });
        }
      });

      // Handle messages from service worker
      // WHY: Enable bidirectional communication with SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[PWA] Message from SW:', event.data);
      });

      // Log successful registration
      console.log('[PWA] Service worker registered:', reg.scope);

      // Cleanup interval on unmount
      return () => clearInterval(updateInterval);
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  };

  // Skip waiting and activate new service worker
  // WHY: Allow users to immediately use updated version
  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Reload page to activate new service worker
      window.location.reload();
    }
  };

  // This component doesn't render anything visible
  // WHY: It's a utility component for SW management only
  return null;
}

// Hook for PWA install prompt
// WHY: Provides easy access to PWA installation functionality
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    // WHY: Don't show install prompt if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkIfInstalled()) {
      return;
    }

    // Listen for beforeinstallprompt event
    // WHY: Capture the install prompt to show it at appropriate time
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    // WHY: Track successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Show the install prompt
  // WHY: Allow app to trigger install at appropriate moment
  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }

    return false;
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}
