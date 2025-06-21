"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";

export function FirebaseConnectionStatus() {
  const [authStatus, setAuthStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">(
    "checking",
  );
  const [emulatorMode, setEmulatorMode] = useState(false);

  useEffect(() => {
    // Check if we're using emulators
    setEmulatorMode(process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true");

    // Test Firebase Auth connection
    if (auth) {
      try {
        // Try to get current user (this will work even with null user)
        auth.onAuthStateChanged(() => {
          setAuthStatus("connected");
        });
      } catch {
        console.error("Auth connection error occurred");
        setAuthStatus("error");
      }
    } else {
      setAuthStatus("error");
    }

    // Test Firestore connection
    if (db) {
      try {
        // Try to access Firestore app (this doesn't make a network request)
        const app = db.app;
        if (app) {
          setDbStatus("connected");
        } else {
          setDbStatus("error");
        }
      } catch {
        console.error("Firestore connection error occurred");
        setDbStatus("error");
      }
    } else {
      setDbStatus("error");
    }
  }, []);

  if (process.env.NODE_ENV === "production") {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-lg shadow-lg text-xs max-w-xs opacity-75 hover:opacity-100 transition-opacity">
      <div className="font-semibold mb-1 text-xs">🔥 Firebase</div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              authStatus === "connected"
                ? "bg-green-400"
                : authStatus === "error"
                  ? "bg-red-400"
                  : "bg-yellow-400"
            }`}
          ></span>
          <span className="text-xs">
            Auth:{" "}
            {authStatus === "connected"
              ? "✓"
              : authStatus === "error"
                ? "✗"
                : "⏳"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dbStatus === "connected"
                ? "bg-green-400"
                : dbStatus === "error"
                  ? "bg-red-400"
                  : "bg-yellow-400"
            }`}
          ></span>
          <span className="text-xs">
            DB:{" "}
            {dbStatus === "connected" ? "✓" : dbStatus === "error" ? "✗" : "⏳"}
          </span>
        </div>

        {emulatorMode && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span className="text-xs">Emulator</span>
          </div>
        )}
      </div>

      {(authStatus === "error" || dbStatus === "error") && (
        <div className="mt-1 text-xs text-red-300">
          Connection issues detected
        </div>
      )}
    </div>
  );
}
