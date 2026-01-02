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

  const loadUserData = useCallback(async (currentUser: User) => {
    try {
      const userProfileResponse = await generatedApiClient.getUserProfile();
      if (userProfileResponse.data?.data) {
        setUserData(userProfileResponse.data.data as UserData);
      }
    } catch (err: unknown) {
      console.error("Error loading user data:", err);

      if (err && typeof err === "object" && "response" in err) {
        const apiError = err as {
          response?: {
            status?: number;
            data?: { error?: string; needsRegistration?: boolean };
          };
        };

        if (
          apiError.response?.status === 401 &&
          apiError.response?.data?.error?.includes("User not found in system")
        ) {
          console.log(
            "User exists in OIDC but not in backend, creating user...",
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
