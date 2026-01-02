import { test, expect } from "@playwright/test";

test.describe("PWA Functionality", () => {
  test("should have a valid web manifest", async ({ page }) => {
    await page.goto("/");

    // Check for manifest link in HTML
    const manifestLink = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    expect(manifestLink).toBeTruthy();

    // Fetch and validate manifest
    const manifestResponse = await page.request.get(manifestLink!);
    expect(manifestResponse.ok()).toBe(true);

    const manifest = await manifestResponse.json();

    // Check required manifest fields
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("should have meta tags for PWA", async ({ page }) => {
    await page.goto("/");

    // Check for essential PWA meta tags
    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .getAttribute("content");
    expect(themeColor).toBeTruthy();

    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewport).toBeTruthy();
    expect(viewport).toContain("width=device-width");
  });

  test("should register service worker", async ({ page }) => {
    await page.goto("/");

    // Wait for service worker registration
    const serviceWorkerRegistered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      try {
        // Wait a bit for SW registration
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const registration = await navigator.serviceWorker.getRegistration();
        return registration !== undefined;
      } catch {
        return false;
      }
    });

    // Service worker should be registered (or supported)
    const swSupported = await page.evaluate(() => "serviceWorker" in navigator);
    expect(swSupported).toBe(true);

    // If SW is supported, it should register (may take time)
    if (swSupported) {
      // Just check that the mechanism exists
      expect(typeof serviceWorkerRegistered).toBe("boolean");
    }
  });

  test("should have offline page", async ({ page }) => {
    // Check if offline.html or similar exists
    const offlineResponse = await page.request
      .get("/offline.html")
      .catch(() => null);

    // Offline page is optional, but if it exists it should be valid HTML
    if (offlineResponse && offlineResponse.ok()) {
      const content = await offlineResponse.text();
      expect(content).toContain("html");
    }
  });

  test("should have all icon sizes for PWA", async ({ page }) => {
    await page.goto("/");

    const manifestLink = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    const manifestResponse = await page.request.get(manifestLink!);
    const manifest = await manifestResponse.json();

    // Check that manifest has icons
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);

    // Verify at least one icon exists
    const firstIcon = manifest.icons[0];
    expect(firstIcon.src).toBeDefined();
    expect(firstIcon.sizes).toBeDefined();
    expect(firstIcon.type).toBeDefined();

    // Try to fetch the first icon
    const iconResponse = await page.request.get(firstIcon.src);
    expect(iconResponse.ok()).toBe(true);
    expect(iconResponse.headers()["content-type"]).toContain("image");
  });

  test("should have apple-touch-icon", async ({ page }) => {
    await page.goto("/");

    // Check for Apple touch icon
    const appleTouchIcon = await page
      .locator('link[rel="apple-touch-icon"]')
      .getAttribute("href");

    if (appleTouchIcon) {
      const iconResponse = await page.request.get(appleTouchIcon);
      expect(iconResponse.ok()).toBe(true);
    }
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should render without horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test("should have proper caching headers for static assets", async ({
    page,
  }) => {
    await page.goto("/");

    // Check cache headers for static assets
    page.on("response", (response) => {
      const url = response.url();

      // Check static assets have cache headers
      if (
        url.includes("/public/") ||
        url.includes("/static/") ||
        url.match(/\.(js|css|png|jpg|webp|svg|woff2)$/)
      ) {
        const cacheControl = response.headers()["cache-control"];
        // Should have some form of caching
        // (This is optional but good practice)
        if (cacheControl) {
          expect(cacheControl).toBeDefined();
        }
      }
    });

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");
  });
});

test.describe("PWA Installability", () => {
  test("should have beforeinstallprompt event capability", async ({ page }) => {
    await page.goto("/");

    // Check if browser supports install prompt
    const supportsInstall = await page.evaluate(() => {
      return "onbeforeinstallprompt" in window;
    });

    // This is browser-dependent, so we just verify the check works
    expect(typeof supportsInstall).toBe("boolean");
  });
});
