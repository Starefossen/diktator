"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
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

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  role: "parent" | "child";
  parentId?: string;
  children?: string[];
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface User {
  uid: string;
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  needsRegistration: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

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
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const router = useRouter();

  const loadUserData = useCallback(async (currentUser: User) => {
    try {
      console.log("[OIDCAuthContext] loadUserData: fetching profile for user:", currentUser.email);
      const userProfileResponse = await generatedApiClient.getUserProfile();
      const profileData = userProfileResponse.data?.data as
        | (UserData & { needsRegistration?: boolean })
        | undefined;

      console.log("[OIDCAuthContext] loadUserData: profile response:", { profileData, needsRegistration: profileData?.needsRegistration });

      if (profileData?.needsRegistration) {
        console.log("[OIDCAuthContext] loadUserData: Setting needsRegistration=true");
        setNeedsRegistration(true);
        // Don't redirect here - let pages handle it based on needsRegistration flag
        return;
      }

      if (profileData) {
        console.log("[OIDCAuthContext] loadUserData: Profile loaded, setting needsRegistration=false");
        setUserData(profileData as UserData);
        setNeedsRegistration(false);
      }
    } catch (err: unknown) {
      console.error("[OIDCAuthContext] Error loading user data:", err);

      if (err && typeof err === "object" && "response" in err) {
        const apiError = err as {
          response?: {
            status?: number;
            data?: any;
          };
        };

        console.log("[OIDCAuthContext] loadUserData: Full error response:", {
          status: apiError.response?.status,
          data: apiError.response?.data,
          dataKeys: apiError.response?.data ? Object.keys(apiError.response.data) : [],
        });

        if (apiError.response?.status === 404) {
          console.log("[OIDCAuthContext] loadUserData: Got 404, checking needsRegistration in response data");
          // Try multiple possible locations for needsRegistration flag
          const needsReg =
            apiError.response?.data?.needsRegistration ||
            apiError.response?.data?.Data?.needsRegistration ||
            apiError.response?.data?.data?.needsRegistration ||
            (apiError.response?.data as any)?.needsRegistration;

          console.log("[OIDCAuthContext] loadUserData: needsRegistration from 404 response:", needsReg);

          // If we got a 404, user doesn't exist yet - they need registration
          // This is the fallback when the flag isn't explicitly returned
          if (needsReg === true || needsReg === undefined) {
            console.log("[OIDCAuthContext] loadUserData: 404 indicates user needs registration");
            setNeedsRegistration(true);
            setUserData(null);
            // Don't redirect here - let pages handle it based on needsRegistration flag
            return;
          }
        }
      }
      console.log("[OIDCAuthContext] loadUserData: Setting userdata=null");
      setUserData(null);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      console.log("[OIDCAuthContext] checkAuth: starting");

      if (!isAuthenticated()) {
        console.log("[OIDCAuthContext] checkAuth: Not authenticated");
        setUser(null);
        setUserData(null);
        setNeedsRegistration(false);
        return;
      }

      console.log("[OIDCAuthContext] checkAuth: Authenticated, fetching user info");
      const oidcUser = await getUserInfo();
      const currentUser = toUser(oidcUser);
      console.log("[OIDCAuthContext] checkAuth: Got user:", currentUser?.email);
      setUser(currentUser);

      if (currentUser) {
        console.log("[OIDCAuthContext] checkAuth: Loading user data");
        await loadUserData(currentUser);
      }
    } catch (err) {
      console.error("[OIDCAuthContext] Error checking auth:", err);
      setUser(null);
      setUserData(null);
      setNeedsRegistration(false);
    } finally {
      setLoading(false);
      console.log("[OIDCAuthContext] checkAuth: finished");
    }
  }, [loadUserData]);

  const refreshUserData = useCallback(async () => {
    if (user) {
      await loadUserData(user);
    }
  }, [user, loadUserData]);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      if (isMockMode) {
        await initiateLogin();
        await checkAuth();
      } else {
        await initiateLogin(window.location.href);
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("Failed to initiate login. Please try again.");
      throw err;
    }
  }, [checkAuth]);

  const logOut = useCallback(async () => {
    try {
      setError(null);
      await initiateLogout();
      setUser(null);
      setUserData(null);
      setNeedsRegistration(false);
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to log out. Please try again.");
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getToken = useCallback(() => {
    return getAccessToken();
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for storage events to detect token changes (cross-tab and manual triggers)
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkAuth]);

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
    needsRegistration,
    signIn,
    logOut,
    clearError,
    refreshUserData,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
