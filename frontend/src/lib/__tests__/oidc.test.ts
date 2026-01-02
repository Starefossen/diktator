import { describe, it, expect, beforeEach } from "vitest";
import { isAuthenticated, getAccessToken, isMockMode } from "../oidc";

describe("OIDC Library", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Mock Mode", () => {
    it("should be in mock mode when NEXT_PUBLIC_AUTH_MODE is mock", () => {
      expect(isMockMode).toBe(true);
    });

    it("should return true for isAuthenticated() in mock mode", () => {
      expect(isAuthenticated()).toBe(true);
    });

    it("should return mock token from getAccessToken() in mock mode", () => {
      const token = getAccessToken();
      expect(token).toBe("mock-jwt-token-for-development");
    });
  });

  describe("Token Storage", () => {
    it("should store and retrieve tokens from localStorage", () => {
      const testToken = "test-access-token";
      const expiry = Date.now() + 3600000; // 1 hour from now

      localStorage.setItem("oidc_access_token", testToken);
      localStorage.setItem("oidc_token_expiry", expiry.toString());

      expect(localStorage.getItem("oidc_access_token")).toBe(testToken);
    });
  });
});
