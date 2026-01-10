// Generic OIDC authentication configuration
// Works with any OIDC-compliant identity provider (Zitadel, Keycloak, Auth0, etc.)
//
// OIDC Authentication Flow (when NEXT_PUBLIC_AUTH_MODE=oidc):
// 1. User clicks "Login" button → initiateLogin() is called
// 2. App redirects to OIDC provider's authorization endpoint
// 3. User authenticates at the provider (enters credentials there, NOT in our app)
// 4. Provider redirects back to /auth/callback with authorization code
// 5. handleCallback() exchanges code for access/ID tokens
// 6. Tokens are stored in localStorage for API calls
//
// Mock Mode (when NEXT_PUBLIC_AUTH_MODE=mock):
// - Simulates authentication without a real OIDC provider
// - Useful for local development and testing
// - Any credentials work (they're ignored)
// - Mock tokens are stored immediately
// - Supports user switching via localStorage key 'mock_user_id'

// OIDC Configuration from environment
const oidcConfig = {
  // OIDC issuer URL (e.g., https://auth.example.com)
  issuerUrl: process.env.NEXT_PUBLIC_OIDC_ISSUER_URL || "",
  // Client ID for this application
  clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || "",
  // Redirect URI after login
  redirectUri:
    process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : ""),
  // Post-logout redirect URI
  postLogoutRedirectUri:
    process.env.NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI ||
    (typeof window !== "undefined" ? window.location.origin : ""),
  // Scopes to request - explicitly include email to get email claim in token
  scopes: process.env.NEXT_PUBLIC_OIDC_SCOPES || "openid profile email",
};

// Auth mode: 'oidc' for production, 'mock' for local development
const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || "mock";

// Check if we're in mock mode (for local development without OIDC provider)
export const isMockMode = authMode === "mock";

// Mock users for development mode - must match backend/internal/services/auth/mock.go
export const MOCK_USERS = {
  "mock-user-12345": {
    id: "mock-user-12345",
    email: "dev@localhost",
    name: "Development User",
    role: "parent" as const,
  },
  "mock-child-1": {
    id: "mock-child-1",
    email: "child1@dev.localhost",
    name: "Alex Dev",
    role: "child" as const,
  },
  "mock-child-2": {
    id: "mock-child-2",
    email: "child2@dev.localhost",
    name: "Sam Dev",
    role: "child" as const,
  },
} as const;

export type MockUserId = keyof typeof MOCK_USERS;

// Key for storing selected mock user in localStorage
const MOCK_USER_KEY = "mock_user_id";

// Get currently selected mock user ID
export function getMockUserId(): MockUserId {
  if (typeof window === "undefined") return "mock-user-12345";
  const stored = localStorage.getItem(MOCK_USER_KEY);
  if (stored && stored in MOCK_USERS) {
    return stored as MockUserId;
  }
  return "mock-user-12345";
}

// Set mock user ID and trigger auth refresh
export function setMockUserId(userId: MockUserId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_USER_KEY, userId);
  // Trigger storage event to refresh auth state
  window.dispatchEvent(new Event("storage"));
}

// Get current mock user based on selected ID
function getMockUser() {
  const userId = getMockUserId();
  return MOCK_USERS[userId];
}

// Mock token for development - now includes user ID for switching
export function getMockToken(): string {
  return getMockUserId();
}

// Token storage keys
const ACCESS_TOKEN_KEY = "oidc_access_token";
const ID_TOKEN_KEY = "oidc_id_token";
const REFRESH_TOKEN_KEY = "oidc_refresh_token";
const TOKEN_EXPIRY_KEY = "oidc_token_expiry";

// OIDC User interface
export interface OIDCUser {
  id: string; // Subject claim (sub)
  email: string;
  name: string;
  emailVerified: boolean;
  picture?: string;
  [key: string]: unknown; // Additional claims
}

// Token response from OIDC provider
export interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// OIDC Discovery document
interface OIDCDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint?: string;
  jwks_uri: string;
  scopes_supported: string[];
  response_types_supported: string[];
  grant_types_supported: string[];
}

// Cache for discovery document
let discoveryCache: OIDCDiscovery | null = null;

/**
 * Fetch OIDC discovery document
 */
async function getDiscoveryDocument(): Promise<OIDCDiscovery | null> {
  if (isMockMode) {
    return null;
  }

  if (discoveryCache) {
    return discoveryCache;
  }

  try {
    const response = await fetch(
      `${oidcConfig.issuerUrl}/.well-known/openid-configuration`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch discovery document: ${response.status}`);
    }
    discoveryCache = await response.json();
    return discoveryCache;
  } catch (error) {
    console.error("Failed to fetch OIDC discovery document:", error);
    return null;
  }
}

/**
 * Generate a random string for PKCE and state
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Generate PKCE code verifier and challenge
 */
async function generatePKCE(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const verifier = generateRandomString(32);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { verifier, challenge };
}

/**
 * Store tokens in localStorage
 */
function storeTokens(tokens: TokenResponse): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  if (tokens.id_token) {
    localStorage.setItem(ID_TOKEN_KEY, tokens.id_token);
  }
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }
  const expiry = Date.now() + tokens.expires_in * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
}

/**
 * Clear stored tokens
 */
function clearTokens(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  sessionStorage.removeItem("oidc_pkce_verifier");
  sessionStorage.removeItem("oidc_state");
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  if (isMockMode) {
    return getMockToken();
  }

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) {
    return null;
  }

  // Check if token is expired (with 60 second buffer)
  const expiryTime = parseInt(expiry);
  const now = Date.now();

  if (now > expiryTime - 60000) {
    // Token is expired or expiring soon - try to refresh
    refreshAccessToken().catch(() => {
      // Refresh failed, token will be null on next call
    });

    // If already expired, return null
    if (now > expiryTime) {
      return null;
    }
  }

  return token;
}

/**
 * Get stored ID token (for API authentication)
 * ID tokens from Zitadel have the correct audience claim for the client
 */
export function getIdToken(): string | null {
  if (typeof window === "undefined") return null;

  if (isMockMode) {
    return getMockToken();
  }

  const token = localStorage.getItem(ID_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) {
    return null;
  }

  // Check if token is expired (with 60 second buffer)
  const expiryTime = parseInt(expiry);
  const now = Date.now();

  if (now > expiryTime - 60000) {
    // Token is expired or expiring soon - try to refresh
    refreshAccessToken().catch(() => {
      // Refresh failed, token will be null on next call
    });

    // If already expired, return null
    if (now > expiryTime) {
      return null;
    }
  }

  return token;
}

/**
 * Check if user is authenticated (has valid ID token)
 */
export function isAuthenticated(): boolean {
  if (isMockMode) {
    return true;
  }
  return getIdToken() !== null;
}

/**
 * Parse JWT token and extract claims (without verification - for display only)
 */
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Get user info from token or userinfo endpoint
 * Zitadel may not include email in ID token if not properly scoped,
 * so we fall back to userinfo endpoint
 */
export async function getUserInfo(): Promise<OIDCUser | null> {
  if (isMockMode) {
    const mockUser = getMockUser();
    return {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      emailVerified: true,
    };
  }

  const idToken = getIdToken();
  let userFromToken: OIDCUser | null = null;

  if (idToken) {
    const claims = parseJwt(idToken);
    if (claims) {
      console.log("[OIDC] ID token claims:", {
        sub: claims.sub,
        email: claims.email,
        name: claims.name,
        preferred_username: claims.preferred_username,
      });
      userFromToken = {
        id: claims.sub as string,
        email: (claims.email as string) || "",
        name:
          (claims.name as string) ||
          (claims.preferred_username as string) ||
          "",
        emailVerified: (claims.email_verified as boolean) || false,
        picture: claims.picture as string | undefined,
        ...claims,
      };

      // If we got email from token, return immediately
      if (userFromToken.email) {
        console.log("[OIDC] Got email from ID token, returning user");
        return userFromToken;
      }

      // Email missing from token, will try userinfo endpoint below
      console.log(
        "[OIDC] Email missing from ID token, will fetch from userinfo endpoint",
      );
    }
  }

  // Fetch from userinfo endpoint to get complete user info (especially email if missing from token)
  const accessToken = getAccessToken();
  if (!accessToken) {
    console.log(
      "[OIDC] No access token, returning user from token if available",
    );
    return userFromToken;
  }

  try {
    const discovery = await getDiscoveryDocument();
    if (!discovery?.userinfo_endpoint) {
      console.log(
        "[OIDC] No userinfo endpoint in discovery, returning user from token",
      );
      return userFromToken;
    }

    console.log("[OIDC] Fetching user info from userinfo endpoint");
    const response = await fetch(discovery.userinfo_endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.log(
        "[OIDC] Userinfo endpoint returned non-OK status:",
        response.status,
      );
      return userFromToken;
    }

    const userInfo = await response.json();
    console.log("[OIDC] Userinfo response:", {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      preferred_username: userInfo.preferred_username,
    });

    // Merge with token data, userinfo takes precedence
    const mergedUser: OIDCUser = {
      id: userInfo.sub || userFromToken?.id || "",
      email: userInfo.email || userFromToken?.email || "",
      name:
        userInfo.name ||
        userInfo.preferred_username ||
        userFromToken?.name ||
        "",
      emailVerified:
        userInfo.email_verified !== undefined
          ? userInfo.email_verified
          : userFromToken?.emailVerified || false,
      picture: userInfo.picture || userFromToken?.picture,
      ...userInfo,
    };

    console.log("[OIDC] Returning merged user:", {
      id: mergedUser.id,
      email: mergedUser.email,
      name: mergedUser.name,
    });
    return mergedUser;
  } catch (error) {
    console.error("[OIDC] Failed to fetch user info from endpoint:", error);
    return userFromToken;
  }
}

/**
 * Initiate OIDC login flow (redirect to authorization endpoint)
 */
export async function initiateLogin(returnTo?: string): Promise<void> {
  if (isMockMode) {
    console.log("Mock mode: Login simulated");
    // In mock mode, store mock tokens
    const token = getMockToken();
    storeTokens({
      access_token: token,
      id_token: token,
      token_type: "Bearer",
      expires_in: 3600,
    });
    // Reload to trigger auth state change
    if (typeof window !== "undefined") {
      window.location.reload();
    }
    return;
  }

  const discovery = await getDiscoveryDocument();
  if (!discovery) {
    throw new Error("Failed to get OIDC discovery document");
  }

  // Generate PKCE challenge
  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem("oidc_pkce_verifier", verifier);

  // Generate state for CSRF protection
  const state = generateRandomString(16);
  sessionStorage.setItem("oidc_state", state);

  // Store return URL
  if (returnTo) {
    sessionStorage.setItem("oidc_return_to", returnTo);
  }

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: oidcConfig.clientId,
    response_type: "code",
    scope: oidcConfig.scopes,
    redirect_uri: oidcConfig.redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${discovery.authorization_endpoint}?${params}`;
}

/**
 * Handle OIDC callback (exchange code for tokens)
 */
export async function handleCallback(
  code: string,
  state: string,
): Promise<OIDCUser | null> {
  if (isMockMode) {
    return getUserInfo();
  }

  // Verify state
  const storedState = sessionStorage.getItem("oidc_state");
  if (state !== storedState) {
    throw new Error("Invalid state parameter - possible CSRF attack");
  }

  // Get PKCE verifier
  const verifier = sessionStorage.getItem("oidc_pkce_verifier");
  if (!verifier) {
    throw new Error("PKCE verifier not found");
  }

  const discovery = await getDiscoveryDocument();
  if (!discovery) {
    throw new Error("Failed to get OIDC discovery document");
  }

  // Exchange code for tokens
  const response = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: oidcConfig.clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: oidcConfig.redirectUri,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens: TokenResponse = await response.json();
  storeTokens(tokens);

  // Clean up session storage
  sessionStorage.removeItem("oidc_pkce_verifier");
  sessionStorage.removeItem("oidc_state");

  return getUserInfo();
}

/**
 * Initiate logout flow
 */
export async function initiateLogout(): Promise<void> {
  if (isMockMode) {
    console.log("Mock mode: Logout simulated");
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return;
  }

  const idToken = getIdToken();
  clearTokens();

  const discovery = await getDiscoveryDocument();
  if (discovery?.end_session_endpoint && idToken) {
    const params = new URLSearchParams({
      id_token_hint: idToken,
      post_logout_redirect_uri: oidcConfig.postLogoutRedirectUri,
    });
    window.location.href = `${discovery.end_session_endpoint}?${params}`;
  } else {
    // No end_session_endpoint, just redirect home
    window.location.href = oidcConfig.postLogoutRedirectUri || "/";
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isMockMode) return true;

  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return false;
  }

  try {
    const discovery = await getDiscoveryDocument();
    if (!discovery?.token_endpoint) {
      return false;
    }

    const response = await fetch(discovery.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: oidcConfig.clientId,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      // Refresh failed, clear tokens
      clearTokens();
      return false;
    }

    const tokens: TokenResponse = await response.json();
    storeTokens(tokens);

    // Trigger storage event for AuthContext synchronization
    window.dispatchEvent(new Event("storage"));

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearTokens();
    return false;
  }
}

/**
 * Get return URL after login
 */
export function getReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  const returnTo = sessionStorage.getItem("oidc_return_to");
  sessionStorage.removeItem("oidc_return_to");
  return returnTo;
}
