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

  useEffect(() => {
    // Feature flag for service worker (can be disabled remotely if needed)
    const swEnabled = process.env.NEXT_PUBLIC_SW_ENABLED !== "false";
    // Disable service worker in development to avoid random reloads
    const isProduction = process.env.NODE_ENV === "production";

    // Register service worker
    if ("serviceWorker" in navigator && isProduction && swEnabled) {
      let refreshing = false; // Guard against multiple reloads

      // Handle controller change (when new SW takes control)
      const handleControllerChange = () => {
        if (!refreshing) {
          refreshing = true;
          console.log("Service worker activated, reloading page");
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener(
        "controllerchange",
        handleControllerChange,
      );

      // Register service worker immediately, not waiting for load event
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            {
              updateViaCache: "none", // Always check for updates
            },
          );
          console.log("✓ Service worker registered successfully");

          // Helper to show update prompt
          const promptForUpdate = () => {
            console.log("New service worker available, prompting user");
            setShowUpdatePrompt(true);
          };

          // Check if there's already a waiting service worker
          if (registration.waiting && navigator.serviceWorker.controller) {
            console.log("Service worker update already waiting");
            promptForUpdate();
          }

          // Check for updates immediately
          registration.update();

          // Listen for service worker updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker installed and ready
                promptForUpdate();
              }
            });
          });

          // Check for updates less frequently (every 5 minutes) to avoid disrupting user experience
          const updateInterval = setInterval(() => {
            if (!document.hidden) {
              console.log("Checking for service worker updates...");
              registration.update();
            }
          }, 300000); // 5 minutes instead of 30 seconds

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

      // Return cleanup function
      return () => {
        if (updateInterval) {
          clearInterval(updateInterval);
        }
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          handleControllerChange,
        );
      };
    } else if (!isProduction || !swEnabled) {
      const reason = !isProduction
        ? "development mode"
        : "feature flag disabled";
      console.log(`Service worker disabled (${reason})`);
      // Unregister any existing service workers
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          if (registrations.length > 0) {
            console.log(
              `Found ${registrations.length} service worker(s), unregistering...`,
            );
            registrations.forEach((registration) => {
              registration.unregister().then((success) => {
                if (success) {
                  console.log("✓ Service worker unregistered successfully");
                } else {
                  console.warn("⚠ Failed to unregister service worker");
                }
              });
            });
          } else {
            console.log("No service workers to unregister");
          }
        });
      }
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

  const handleUpdateClick = async () => {
    // Get the waiting service worker
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.waiting) {
      console.warn("No waiting service worker found");
      return;
    }

    // Tell the waiting service worker to activate
    // The controllerchange listener (set up in useEffect) will handle the reload
    console.log("Sending SKIP_WAITING message to service worker");
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
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
        setTimeout(() => setShowInstallPrompt(false), 0);
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
