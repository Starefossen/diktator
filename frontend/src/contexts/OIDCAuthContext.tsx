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
import { useLanguage } from "@/contexts/LanguageContext";

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  familyName?: string;
  role: "parent" | "child";
  parentId?: string;
  children?: string[];
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface FamilyInvitation {
  id: string;
  familyId: string;
  familyName: string; // Name of the family being invited to
  email: string;
  role: "parent" | "child";
  invitedBy: string;
  status: string;
  createdAt: string;
  expiresAt: string;
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
  hasPendingInvites: boolean;
  pendingInvitations: FamilyInvitation[];
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
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [hasPendingInvites, setHasPendingInvites] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<
    FamilyInvitation[]
  >([]);

  const loadUserData = useCallback(async (currentUser: User) => {
    try {
      console.log(
        "[OIDCAuthContext] loadUserData: fetching profile for user:",
        currentUser.email,
      );
      const userProfileResponse = await generatedApiClient.getUserProfile();
      const profileData = userProfileResponse.data?.data as
        | (UserData & {
            needsRegistration?: boolean;
            hasPendingInvites?: boolean;
            pendingInvitations?: FamilyInvitation[];
          })
        | undefined;

      console.log("[OIDCAuthContext] loadUserData: profile response:", {
        profileData,
        needsRegistration: profileData?.needsRegistration,
      });

      // Check for pending invitations
      if (profileData?.hasPendingInvites && profileData?.pendingInvitations) {
        console.log(
          "[OIDCAuthContext] loadUserData: User has pending invitations",
          {
            count: (profileData.pendingInvitations as FamilyInvitation[])
              .length,
            invitations: profileData.pendingInvitations,
          },
        );
        setHasPendingInvites(true);
        setPendingInvitations(
          profileData.pendingInvitations as FamilyInvitation[],
        );
        setNeedsRegistration(false);
        setUserData(null);
        return;
      }

      if (profileData?.needsRegistration) {
        console.log(
          "[OIDCAuthContext] loadUserData: Setting needsRegistration=true",
        );
        setNeedsRegistration(true);
        // Don't redirect here - let pages handle it based on needsRegistration flag
        return;
      }

      if (profileData) {
        console.log(
          "[OIDCAuthContext] loadUserData: Profile loaded, setting needsRegistration=false",
        );
        setUserData(profileData as UserData);
        setNeedsRegistration(false);
      }
    } catch (err: unknown) {
      console.error("[OIDCAuthContext] Error loading user data:", err);

      if (err && typeof err === "object" && "response" in err) {
        const apiError = err as {
          response?: {
            status?: number;
            data?: {
              needsRegistration?: boolean;
              Data?: { needsRegistration?: boolean };
              data?: { needsRegistration?: boolean };
              [key: string]: unknown;
            };
          };
        };

        console.log("[OIDCAuthContext] loadUserData: Full error response:", {
          status: apiError.response?.status,
          data: apiError.response?.data,
          dataKeys: apiError.response?.data
            ? Object.keys(apiError.response.data)
            : [],
        });

        if (apiError.response?.status === 404) {
          console.log(
            "[OIDCAuthContext] loadUserData: Got 404, checking for pending invitations",
          );

          // Check if user has pending invitations (child account created by parent)
          try {
            const invitationsResponse =
              await generatedApiClient.getPendingInvitations();
            const invitations = invitationsResponse.data?.data as
              | FamilyInvitation[]
              | undefined;

            if (invitations && invitations.length > 0) {
              console.log(
                "[OIDCAuthContext] loadUserData: Found pending invitations:",
                invitations.length,
              );
              setHasPendingInvites(true);
              setPendingInvitations(invitations);
              setNeedsRegistration(false);
              setUserData(null);
              return;
            }
          } catch (invErr) {
            console.log(
              "[OIDCAuthContext] loadUserData: No pending invitations found or error checking:",
              invErr,
            );
          }

          // No pending invitations, user truly needs registration
          console.log(
            "[OIDCAuthContext] loadUserData: No pending invitations, user needs registration",
          );
          setNeedsRegistration(true);
          setUserData(null);
          setHasPendingInvites(false);
          setPendingInvitations([]);
          return;
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
        setHasPendingInvites(false);
        setPendingInvitations([]);
        return;
      }

      console.log(
        "[OIDCAuthContext] checkAuth: Authenticated, fetching user info",
      );
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
      setError(t("auth.error.loginFailed"));
      throw err;
    }
  }, [checkAuth, t]);

  const logOut = useCallback(async () => {
    try {
      setError(null);
      await initiateLogout();
      setUser(null);
      setUserData(null);
      setNeedsRegistration(false);
      setHasPendingInvites(false);
      setPendingInvitations([]);
    } catch (err) {
      console.error("Logout error:", err);
      setError(t("auth.error.logoutFailed"));
      throw err;
    }
  }, [t]);

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
    hasPendingInvites,
    pendingInvitations,
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
