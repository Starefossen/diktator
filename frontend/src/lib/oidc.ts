// Generic OIDC authentication configuration
// Works with any OIDC-compliant identity provider (Zitadel, Keycloak, Auth0, etc.)

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
  // Scopes to request
  scopes: process.env.NEXT_PUBLIC_OIDC_SCOPES || "openid profile email",
};

// Auth mode: 'oidc' for production, 'mock' for local development
const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || "mock";

// Check if we're in mock mode (for local development without OIDC provider)
export const isMockMode = authMode === "mock";

// Mock user for development mode
const mockUser = {
  id: process.env.NEXT_PUBLIC_MOCK_USER_ID || "mock-user-12345",
  email: process.env.NEXT_PUBLIC_MOCK_USER_EMAIL || "dev@localhost",
  name: process.env.NEXT_PUBLIC_MOCK_USER_NAME || "Development User",
};

// Mock token for development (never use in production!)
export const mockToken = "mock-jwt-token-for-development";

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
    return mockToken;
  }

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) {
    return null;
  }

  // Check if token is expired (with 60 second buffer)
  if (Date.now() > parseInt(expiry) - 60000) {
    return null;
  }

  return token;
}

/**
 * Get stored ID token
 */
function getIdToken(): string | null {
  if (typeof window === "undefined") return null;

  if (isMockMode) {
    return mockToken;
  }

  return localStorage.getItem(ID_TOKEN_KEY);
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  if (isMockMode) {
    return true;
  }
  return getAccessToken() !== null;
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
 */
export async function getUserInfo(): Promise<OIDCUser | null> {
  if (isMockMode) {
    return {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      emailVerified: true,
    };
  }

  const idToken = getIdToken();
  if (idToken) {
    const claims = parseJwt(idToken);
    if (claims) {
      return {
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
    }
  }

  // Fallback: fetch from userinfo endpoint
  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    const discovery = await getDiscoveryDocument();
    if (!discovery?.userinfo_endpoint) {
      return null;
    }

    const response = await fetch(discovery.userinfo_endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const userInfo = await response.json();
    return {
      id: userInfo.sub,
      email: userInfo.email || "",
      name: userInfo.name || userInfo.preferred_username || "",
      emailVerified: userInfo.email_verified || false,
      picture: userInfo.picture,
      ...userInfo,
    };
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return null;
  }
}

/**
 * Initiate OIDC login flow (redirect to authorization endpoint)
 */
export async function initiateLogin(returnTo?: string): Promise<void> {
  if (isMockMode) {
    console.log("Mock mode: Login simulated");
    // In mock mode, store mock tokens
    storeTokens({
      access_token: mockToken,
      id_token: mockToken,
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
 * Get return URL after login
 */
export function getReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  const returnTo = sessionStorage.getItem("oidc_return_to");
  sessionStorage.removeItem("oidc_return_to");
  return returnTo;
}
