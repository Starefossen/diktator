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
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// User data interface
export interface UserData {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  role: "parent" | "child";
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

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      // Don't set loading here - let onAuthStateChanged handle it

      // Check if Firebase is properly initialized
      if (!auth) {
        throw new Error(
          "Firebase Auth is not initialized. Please check your Firebase configuration.",
        );
      }

      const result = await signInWithEmailAndPassword(auth, email, password);

      // Update last active time
      if (result.user && db) {
        try {
          await setDoc(
            doc(db, "users", result.user.uid),
            {
              lastActiveAt: new Date().toISOString(),
            },
            { merge: true },
          );
        } catch (dbError: unknown) {
          console.warn("Failed to update last active time:", dbError);
          // Don't fail login if we can't update the timestamp
        }
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
      setLoading(false); // Only set loading false on error
      throw err;
    }
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: "parent" | "child",
  ) => {
    try {
      setError(null);
      // Don't set loading here - let onAuthStateChanged handle it

      // Check if Firebase is properly initialized
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
        try {
          // Update user profile
          await updateProfile(result.user, { displayName });

          // Create user document in Firestore
          if (db) {
            const newUserData: UserData = {
              id: result.user.uid,
              email: result.user.email!,
              displayName,
              familyId: result.user.uid, // For now, user creates their own family
              role,
              createdAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            };

            await setDoc(doc(db, "users", result.user.uid), newUserData);
          } else {
            console.warn(
              "Firestore is not initialized, user document not created",
            );
          }
        } catch (profileError: unknown) {
          console.error(
            "Error updating profile or creating user document:",
            profileError,
          );
          // Don't fail signup if profile update fails - user is still created
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
      setLoading(false); // Only set loading false on error
      throw err;
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

  // Load user data from Firestore
  const loadUserData = async (user: User) => {
    if (!db) {
      console.warn("Firestore is not initialized, cannot load user data");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      } else {
        console.warn("User document does not exist in Firestore");
      }
    } catch (err: unknown) {
      console.error("Error loading user data:", err);
      // Don't set error state for user data loading as it's not critical for auth
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // Set loading to false immediately after setting user
        // Load user data in the background without blocking UI
        setLoading(false);
        loadUserData(user); // Don't await this - let it run in background
      } else {
        setUserData(null);
        setLoading(false);
      }
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
