import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TestResult, UserData } from "@/types/firestore";

// Save test result to Firestore
export async function saveTestResult(
  testResult: Omit<TestResult, "id" | "createdAt">,
): Promise<string | null> {
  if (!db) {
    console.warn("Firestore not initialized");
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, "testResults"), {
      ...testResult,
      createdAt: serverTimestamp(),
    });

    console.log("Test result saved with ID:", docRef.id);
    return docRef.id;
  } catch {
    console.error("Error saving test result occurred");
    return null;
  }
}

// Update user's last active time
export async function updateUserActivity(userId: string): Promise<void> {
  if (!db) return;

  try {
    await setDoc(
      doc(db, "users", userId),
      {
        lastActiveAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    console.error("Error updating user activity occurred");
  }
}

// Save user data to Firestore
export async function saveUserData(userData: UserData): Promise<void> {
  if (!db) return;

  try {
    await setDoc(doc(db, "users", userData.id), userData);
  } catch {
    console.error("Error saving user data occurred");
  }
}
