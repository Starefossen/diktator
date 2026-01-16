import { Page } from "@playwright/test";

export async function setupAuth(page: Page, role: "parent" | "child" = "child") {
  // Set local storage for OIDC mock
  await page.addInitScript(({ role }) => {
    // Determine user ID based on role
    const userId = role === "parent" ? "parent-user-123" : "child-alice-123";
    const token = userId; // In mock mode, token is the user ID
    
    // Set token in localStorage
    window.localStorage.setItem("oidc_access_token", token);
    
    // Set expiry to 1 hour in the future
    const expiry = Date.now() + 3600 * 1000;
    window.localStorage.setItem("oidc_token_expiry", expiry.toString());
    
    // Ensure we are in mock mode
    window.sessionStorage.setItem("auth_mode", "mock");
  }, { role });
}
