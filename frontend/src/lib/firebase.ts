// Firebase configuration with emulator support
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "demo-diktator.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-diktator",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "demo-diktator.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "demo-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators in development
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true"
) {
  // Only connect to emulators on client-side and in development
  try {
    // Check if already connected to avoid double connection
    if (!(auth as { _config?: { emulator?: unknown } })._config?.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099", {
        disableWarnings: true,
      });
    }

    // Check if Firestore emulator is already connected
    if (
      !(
        db as { _delegate?: { _databaseId?: { projectId?: string } } }
      )._delegate?._databaseId?.projectId?.includes("localhost")
    ) {
      connectFirestoreEmulator(db, "localhost", 8088);
    }
  } catch {
    // Emulators might already be connected, ignore connection errors
  }
}

export { auth, db };
