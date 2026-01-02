"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  OIDCUser,
  getUserInfo,
  getAccessToken,
  initiateLogin,
  initiateLogout,
  isAuthenticated,
  isMockMode,
} from "@/lib/oidc";
import { generatedApiClient } from "@/lib/api-generated";

// User data interface - Enhanced for family management
export interface UserData {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  role: "parent" | "child";
  parentId?: string; // Only for child accounts
  children?: string[]; // Only for parent accounts
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
}

// Unified User interface (from OIDC token)
export interface User {
  uid: string; // User ID - kept as 'uid' for backward compatibility
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  photoURL?: string;
}

interface AuthContextType {
  // OIDC user (from token)
  user: User | null;
  // Backend user data
  userData: UserData | null;
  // Loading state
  loading: boolean;
  // Error state
  error: string | null;
  // Auth actions
  signIn: (email?: string, password?: string) => Promise<void>;
  signUp: (
    email?: string,
    password?: string,
    displayName?: string,
    role?: "parent" | "child",
  ) => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
  // Access token for API calls
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Convert OIDC user to internal User format
function toUser(oidcUser: OIDCUser | null): User | null {
  if (!oidcUser) return null;
  return {
    uid: oidcUser.id,
    id: oidcUser.id,
    email: oidcUser.email,
    displayName: oidcUser.name,
    emailVerified: oidcUser.emailVerified,
    photoURL: oidcUser.picture,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data from backend
  const loadUserData = useCallback(async (currentUser: User) => {
    try {
      // Call backend to get user profile
      const userProfileResponse = await generatedApiClient.getUserProfile();
      if (userProfileResponse.data?.data) {
        setUserData(userProfileResponse.data.data as UserData);
      }
    } catch (err: unknown) {
      console.error("Error loading user data:", err);

      // Check if the error indicates the user needs registration
      if (err && typeof err === "object" && "response" in err) {
        const apiError = err as {
          response?: {
            status?: number;
            data?: { error?: string; needsRegistration?: boolean };
          };
        };

        // Handle 401 errors that indicate user not found in backend system
        if (
          apiError.response?.status === 401 &&
          apiError.response?.data?.error?.includes("User not found in system")
        ) {
          console.log(
            "User exists in OIDC but not in backend, creating user...",
          );
          try {
            // Automatically create the user in the backend with default role "parent"
            // Note: Email is provided from the OIDC token on the backend side
            const createResponse = await generatedApiClient.createUser({
              displayName: currentUser.displayName || currentUser.email,
              role: "parent",
            });

            if (createResponse.data?.data) {
              setUserData(createResponse.data.data as UserData);
              console.log("User successfully created in backend");
              return;
            }
          } catch (createError) {
            console.error("Failed to create user in backend:", createError);
          }
        }

        // Handle 404 errors with needsRegistration flag
        if (
          apiError.response?.status === 404 &&
          apiError.response?.data?.needsRegistration
        ) {
          console.log(
            "User needs to complete registration in backend, creating user...",
          );
          try {
            const createResponse = await generatedApiClient.createUser({
              displayName: currentUser.displayName || currentUser.email,
              role: "parent",
            });

            if (createResponse.data?.data) {
              setUserData(createResponse.data.data as UserData);
              console.log("User successfully created in backend");
              return;
            }
          } catch (createError) {
            console.error("Failed to create user in backend:", createError);
          }
        }
      }

      // For other errors, create a basic user data object as fallback
      const basicUserData: UserData = {
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.displayName,
        familyId: "family-" + currentUser.id,
        role: "parent",
        isActive: true,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      setUserData(basicUserData);
    }
  }, []);

  // Check authentication state and load user
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);

      if (!isAuthenticated()) {
        setUser(null);
        setUserData(null);
        return;
      }

      const oidcUser = await getUserInfo();
      const currentUser = toUser(oidcUser);
      setUser(currentUser);

      if (currentUser) {
        await loadUserData(currentUser);
      }
    } catch (err) {
      console.error("Error checking auth:", err);
      setUser(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, [loadUserData]);

  // Refresh user data from backend
  const refreshUserData = useCallback(async () => {
    if (user) {
      await loadUserData(user);
    }
  }, [user, loadUserData]);

  // Sign in - redirects to OIDC provider
  // Parameters are accepted for API compatibility but OIDC uses redirect flow
  const signIn = useCallback(
    async (_email?: string, _password?: string) => {
      setError(null);
      try {
        if (isMockMode) {
          // In mock mode, just refresh auth state
          await initiateLogin();
          await checkAuth();
        } else {
          // Redirect to OIDC provider
          await initiateLogin(window.location.href);
        }
      } catch (err) {
        console.error("Sign in error:", err);
        setError("Failed to initiate login. Please try again.");
        throw err;
      }
    },
    [checkAuth],
  );

  // Sign up - redirects to OIDC provider registration
  // Parameters are accepted for API compatibility but OIDC uses redirect flow
  const signUp = useCallback(
    async (
      _email?: string,
      _password?: string,
      _displayName?: string,
      _role?: "parent" | "child",
    ) => {
      setError(null);
      try {
        if (isMockMode) {
          // In mock mode, just refresh auth state
          await initiateLogin();
          await checkAuth();
        } else {
          // Most OIDC providers use the same endpoint for login/registration
          // The provider handles showing registration option
          await initiateLogin(window.location.href);
        }
      } catch (err) {
        console.error("Sign up error:", err);
        setError("Failed to initiate registration. Please try again.");
        throw err;
      }
    },
    [checkAuth],
  );

  // Log out
  const logOut = useCallback(async () => {
    try {
      setError(null);
      await initiateLogout();
      setUser(null);
      setUserData(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to log out. Please try again.");
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get access token for API calls
  const getToken = useCallback(() => {
    return getAccessToken();
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Periodically check auth (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(
      () => {
        checkAuth();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [checkAuth]);

  const value = {
    user,
    userData,
    loading,
    error,
    signIn,
    signUp,
    logOut,
    clearError,
    refreshUserData,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
