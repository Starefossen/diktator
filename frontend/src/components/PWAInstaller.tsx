"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstaller() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string>("");

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      // Register service worker immediately, not waiting for load event
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("SW registered: ", registration);

          // Check for updates immediately
          registration.update();

          // Listen for service worker updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker installed and ready
                  console.log(
                    "New service worker installed, prompting for update",
                  );
                  setShowUpdatePrompt(true);
                }
              });
            }
          });

          // Check for updates periodically (every 30 seconds when app is active)
          const updateInterval = setInterval(() => {
            if (!document.hidden) {
              registration.update();
            }
          }, 30000);

          // Return cleanup function
          return updateInterval;
        } catch (registrationError) {
          console.log("SW registration failed: ", registrationError);
          return null;
        }
      };

      let updateInterval: NodeJS.Timeout | null = null;

      registerServiceWorker().then((interval) => {
        updateInterval = interval;
      });

      // Listen for messages from service worker (register immediately)
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SW_UPDATED") {
          console.log("Service worker updated to version:", event.data.version);
          setUpdateVersion(event.data.version);
          setShowUpdatePrompt(true);
        }
      });

      // Return cleanup function
      return () => {
        if (updateInterval) {
          clearInterval(updateInterval);
        }
      };
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom install prompt
      setShowInstallPrompt(true);
    };

    // Handle successful installation
    const handleAppInstalled = () => {
      console.log("PWA was installed");
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if app is running in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("App is running in standalone mode");
    }

    // Handle network status changes
    function updateOnlineStatus() {
      const status = navigator.onLine ? "online" : "offline";
      console.log(`App is ${status}`);

      // Add/remove offline class to body
      if (!navigator.onLine) {
        document.body.classList.add("offline");
      } else {
        document.body.classList.remove("offline");
      }
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Set initial status
    updateOnlineStatus();

    // Cleanup
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const handleUpdateClick = () => {
    // Reload the page to activate the new service worker
    window.location.reload();
  };

  const handleUpdateDismiss = () => {
    setShowUpdatePrompt(false);
    // Don't set localStorage for updates - they should be applied
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissClick = () => {
    setShowInstallPrompt(false);
    // Optionally set a flag in localStorage to not show again for a while
    localStorage.setItem("installPromptDismissed", Date.now().toString());
  };

  // Don't show if dismissed recently (within 7 days)
  useEffect(() => {
    const dismissedTime = localStorage.getItem("installPromptDismissed");
    if (dismissedTime) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  if (!showInstallPrompt && !showUpdatePrompt) return null;

  // Show update prompt if available
  if (showUpdatePrompt) {
    return (
      <div className="install-prompt">
        <div className="install-prompt-content">
          <div className="install-prompt-icon">🔄</div>
          <div className="install-prompt-text">
            <div className="install-prompt-title">{t("pwa.update.title")}</div>
            <div className="install-prompt-description">
              {t("pwa.update.description")}
              {updateVersion && ` (Version ${updateVersion})`}
            </div>
          </div>
        </div>
        <div className="install-prompt-actions">
          <button
            className="install-prompt-button primary"
            onClick={handleUpdateClick}
          >
            {t("pwa.update.button")}
          </button>
          <button
            className="install-prompt-button secondary"
            onClick={handleUpdateDismiss}
          >
            {t("pwa.update.dismiss")}
          </button>
        </div>
      </div>
    );
  }

  // Show install prompt
  if (showInstallPrompt) {
    return (
      <div className="install-prompt">
        <div className="install-prompt-content">
          <div className="install-prompt-icon">D</div>
          <div className="install-prompt-text">
            <div className="install-prompt-title">{t("pwa.install.title")}</div>
            <div className="install-prompt-description">
              {t("pwa.install.description")}
            </div>
          </div>
        </div>
        <div className="install-prompt-actions">
          <button
            className="install-prompt-button primary"
            onClick={handleInstallClick}
          >
            {t("pwa.install.button")}
          </button>
          <button
            className="install-prompt-button secondary"
            onClick={handleDismissClick}
          >
            {t("pwa.install.dismiss")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
