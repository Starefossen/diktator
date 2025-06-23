"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
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

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: "parent" | "child",
  ) => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data from backend
  const loadUserData = async (firebaseUser: User) => {
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
            "User exists in Firebase but not in backend, creating user...",
          );
          try {
            // Automatically create the user in the backend with default role "parent"
            const userData = await generatedApiClient.createUser({
              displayName:
                firebaseUser.displayName || firebaseUser.email || "User",
              role: "parent",
            });

            if (userData.data?.data) {
              setUserData(userData.data.data as UserData);
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
            // Automatically create the user in the backend with default role "parent"
            const userData = await generatedApiClient.createUser({
              displayName:
                firebaseUser.displayName || firebaseUser.email || "User",
              role: "parent",
            });

            if (userData.data?.data) {
              setUserData(userData.data.data as UserData);
              console.log("User successfully created in backend");
              return;
            }
          } catch (createError) {
            console.error("Failed to create user in backend:", createError);
          }
        }
      }

      // For other errors, create a basic user data object from Firebase user as fallback
      const basicUserData: UserData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        familyId: "family-" + firebaseUser.uid,
        role: "parent",
        isActive: true,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      setUserData(basicUserData);
    }
  };

  // Refresh user data from backend
  const refreshUserData = async () => {
    if (user) {
      await loadUserData(user);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      if (!auth) {
        throw new Error(
          "Firebase Auth is not initialized. Please check your Firebase configuration.",
        );
      }

      const result = await signInWithEmailAndPassword(auth, email, password);

      // Load user data from backend
      if (result.user) {
        await loadUserData(result.user);
      }
    } catch (err: unknown) {
      console.error("Sign in error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { code?: string; message?: string })?.code ||
            (err as { code?: string; message?: string })?.message ||
            "An unknown error occurred";
      setError(getErrorMessage(errorMessage));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: "parent" | "child" = "parent",
  ) => {
    try {
      setError(null);
      setLoading(true);

      if (!auth) {
        throw new Error(
          "Firebase Auth is not initialized. Please check your Firebase configuration.",
        );
      }

      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      if (result.user) {
        // Update Firebase profile
        await updateProfile(result.user, {
          displayName: displayName,
        });

        // Create user in backend
        try {
          const userData = await generatedApiClient.createUser({
            displayName,
            role,
          });

          if (userData.data?.data) {
            setUserData(userData.data.data as UserData);
          }
        } catch (apiError) {
          console.error("Error creating user in backend:", apiError);
          // Create basic user data as fallback
          const basicUserData: UserData = {
            id: result.user.uid,
            email: result.user.email || "",
            displayName,
            familyId: "family-" + result.user.uid,
            role,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          };
          setUserData(basicUserData);
        }
      }
    } catch (err: unknown) {
      console.error("Sign up error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { code?: string; message?: string })?.code ||
            (err as { code?: string; message?: string })?.message ||
            "An unknown error occurred";
      setError(getErrorMessage(errorMessage));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Log out function
  const logOut = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUserData(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { code?: string; message?: string })?.code ||
            "An unknown error occurred";
      setError(getErrorMessage(errorMessage));
      throw err;
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Load user data from backend
        await loadUserData(firebaseUser);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

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

// Helper function to get user-friendly error messages
function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/user-not-found":
      return "No user found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/operation-not-allowed":
      return "Email/password authentication is not enabled. Please contact support.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/invalid-credential":
      return "Invalid login credentials. Please check your email and password.";
    case "auth/internal-error":
      return "An internal error occurred. Please try again later.";
    case "auth/emulator-config-failed":
      return "Firebase emulator connection failed. Please ensure emulators are running.";
    // Handle Firebase connection errors
    case "Firebase Auth is not initialized. Please check your Firebase configuration.":
      return "Cannot connect to authentication service. Please check your internet connection or try starting Firebase emulators.";
    default:
      // Handle generic errors or unknown error codes
      if (errorCode && errorCode.includes("Firebase")) {
        return "Firebase connection error. Please ensure Firebase emulators are running or check your internet connection.";
      }
      if (errorCode && errorCode.includes("network")) {
        return "Network connection error. Please check your internet connection.";
      }
      if (errorCode && errorCode.includes("emulator")) {
        return "Firebase emulator connection failed. Please start emulators with: mise run firebase-emulators";
      }
      return errorCode || "An unexpected error occurred. Please try again.";
  }
}
