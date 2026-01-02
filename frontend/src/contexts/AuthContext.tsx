"use client";

/**
 * AuthContext - Re-exports from OIDCAuthContext for backward compatibility
 *
 * This module re-exports the OIDC authentication context to maintain
 * compatibility with existing code that imports from AuthContext.
 *
 * For new code, you can import directly from OIDCAuthContext if preferred.
 */

export { AuthProvider, useAuth } from "./OIDCAuthContext";
