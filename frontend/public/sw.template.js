// Service worker template - this gets the cache version dynamically
const CACHE_VERSION = "{{CACHE_VERSION}}";
const CACHE_NAME = `diktator-${CACHE_VERSION}`;
const STATIC_CACHE_URLS = [
  "/",
  "/about/",
  "/auth/",
  "/wordsets/",
  "/family/",
  "/results/",
  "/profile/",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192x192.svg",
  "/icon-512x512.svg",
  "/apple-touch-icon.svg",
];

// Install service worker and cache static assets
self.addEventListener("install", (event) => {
  console.log(`Installing service worker version ${CACHE_VERSION}`);
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache:", CACHE_NAME);
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch((error) => {
        console.error("Cache install failed:", error);
      }),
  );
  // Skip waiting to activate immediately for faster updates
  self.skipWaiting();
});

// Activate service worker and clean up old caches
self.addEventListener("activate", (event) => {
  console.log(`Activating service worker version ${CACHE_VERSION}`);
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith("diktator-")) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        // Notify all clients about the update
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SW_UPDATED",
              version: CACHE_VERSION,
            });
          });
        });
      }),
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Handle fetch requests with cache-first strategy for static assets
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API calls
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("googleapis")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response;
      }

      // For navigation requests, try network first, then fallback to cache
      if (event.request.mode === "navigate") {
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback to cached index page for navigation
            return caches.match("/");
          });
      }

      // For other requests, try network first
      return fetch(event.request)
        .then((response) => {
          // Cache successful responses for static assets
          if (
            response.status === 200 &&
            (event.request.destination === "script" ||
              event.request.destination === "style" ||
              event.request.destination === "image")
          ) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(event.request);
        });
    }),
  );
});

// Handle background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here if needed
  return Promise.resolve();
}

// Handle push notifications (if needed in the future)
self.addEventListener("push", (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: "/icon-192x192.svg",
      badge: "/favicon.svg",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
    };

    event.waitUntil(self.registration.showNotification("Diktator", options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});

// Handle focus events to check for updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "CHECK_FOR_UPDATE") {
    console.log("Manual update check requested");
    // Force an update check by triggering a cache comparison
    event.ports[0].postMessage({
      type: "UPDATE_CHECK_COMPLETE",
      version: CACHE_VERSION,
    });
  }
});
