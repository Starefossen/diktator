import { test, expect } from "@playwright/test";
import { setupAuth } from "./utils/auth";

test.describe("Mode Selection XP Badges", () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication with mock mode
    await setupAuth(page, "child");
  });

  test("should display XP badges on mode selection cards", async ({ page }) => {
    // Go to wordsets page
    await page.goto("/wordsets");
    
    // Wait for the wordsets to load by checking for a known heading
    await expect(page.getByRole("heading", { name: "Norwegian Colors" })).toBeVisible();
    
    // Click the "Start" button for the first wordset to open mode selection
    await page.getByRole("button", { name: /start|go/i }).first().click();

    // Verify modal is open
    const modal = page.locator("[role='dialog']");
    await expect(modal).toBeVisible();

    // Check for XP badges on mode buttons
    // We expect the keyboard mode to have 25 XP based on backend config
    const keyboardButton = modal.locator("button:has-text('Skriv Selv')"); // Type It / Keyboard
    await expect(keyboardButton).toBeVisible();
    
    // Look for the XP badge within the button
    const xpBadge = keyboardButton.getByText(/\d+ XP/);
    await expect(xpBadge).toBeVisible();
    await expect(xpBadge).toContainText("25 XP");

    // Check Letter Tiles mode (Build It) - should be 10 XP
    const letterTilesButton = modal.locator("button:has-text('Bygg Ordet')"); // Build It / Letter Tiles
    await expect(letterTilesButton).toBeVisible();
    const ltBadge = letterTilesButton.getByText(/\d+ XP/);
    await expect(ltBadge).toBeVisible();
    await expect(ltBadge).toContainText("10 XP");
  });
});
