/**
 * API client shim that provides user-friendly method names and automatic authentication
 * This wraps the generated OpenAPI client with Firebase authentication
 */

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  Configuration,
  ChildrenApi,
  FamiliesApi,
  HealthApi,
  UsersApi,
  WordsetsApi,
  ModelsCreateChildAccountRequest,
  ModelsSaveResultRequest,
  ApiUsersPostRequest,
  ModelsCreateWordSetRequest,
  ModelsUpdateWordSetRequest,
  ModelsChildAccount,
} from "@/generated";

// Wait for auth state to be ready
const waitForAuthState = (): Promise<User | null> => {
  return new Promise((resolve) => {
    // If we already have a current user, return immediately
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    // Otherwise, wait for the auth state to be determined
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Create a configuration that automatically includes Firebase auth token
const createConfiguration = async (
  requireAuth = true,
): Promise<Configuration> => {
  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    // Wait for auth state to be ready
    const user = await waitForAuthState();

    if (user) {
      try {
        const idToken = await user.getIdToken();
        authHeaders["Authorization"] = `Bearer ${idToken}`;
      } catch (error) {
        console.error("Failed to get Firebase auth token:", error);
        throw new Error("Authentication failed");
      }
    } else {
      throw new Error("User not authenticated");
    }
  }

  return new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    baseOptions: {
      headers: authHeaders,
    },
  });
};

// Create API client instances with authentication
const createApiInstances = async (requireAuth = true) => {
  const config = await createConfiguration(requireAuth);

  return {
    childrenApi: new ChildrenApi(config),
    familiesApi: new FamiliesApi(config),
    healthApi: new HealthApi(config),
    usersApi: new UsersApi(config),
    wordsetsApi: new WordsetsApi(config),
  };
};

// Main API client with user-friendly method names
export const generatedApiClient = {
  // User management
  async getUserProfile() {
    const { usersApi } = await createApiInstances();
    return usersApi.apiUsersProfileGet();
  },

  async createUser(request: ApiUsersPostRequest) {
    const { usersApi } = await createApiInstances();
    return usersApi.apiUsersPost(request);
  },

  // Family management
  async getFamilyChildren() {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesChildrenGet();
  },

  async getFamilyProgress() {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesProgressGet();
  },

  async getFamilyStats() {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesStatsGet();
  },

  async getFamily() {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesGet();
  },

  // Child account management
  async createChildAccount(request: ModelsCreateChildAccountRequest) {
    const { childrenApi } = await createApiInstances();
    return childrenApi.apiFamiliesChildrenPost(request);
  },

  async deleteChildAccount(childId: string) {
    const { childrenApi } = await createApiInstances();
    return childrenApi.apiFamiliesChildrenChildIdDelete(childId);
  },
  async updateChildAccount(childId: string, request: ModelsChildAccount) {
    const { childrenApi } = await createApiInstances();
    return childrenApi.apiFamiliesChildrenChildIdPut(childId, request);
  },

  async getChildProgress(childId: string) {
    const { childrenApi } = await createApiInstances();
    return childrenApi.apiFamiliesChildrenChildIdProgressGet(childId);
  },

  async getChildResults(childId: string) {
    const { childrenApi } = await createApiInstances();
    return childrenApi.apiFamiliesChildrenChildIdResultsGet(childId);
  },

  // Word sets management
  async getWordSets() {
    const { wordsetsApi } = await createApiInstances();
    return wordsetsApi.apiWordsetsGet();
  },

  async createWordSet(request: ModelsCreateWordSetRequest) {
    const { wordsetsApi } = await createApiInstances();
    return wordsetsApi.apiWordsetsPost(request);
  },

  async updateWordSet(id: string, request: ModelsUpdateWordSetRequest) {
    const { wordsetsApi } = await createApiInstances();
    return wordsetsApi.apiWordsetsIdPut(id, request);
  },

  async deleteWordSet(id: string) {
    const { wordsetsApi } = await createApiInstances();
    return wordsetsApi.apiWordsetsIdDelete(id);
  },

  async generateAudio(id: string) {
    const { wordsetsApi } = await createApiInstances();
    return wordsetsApi.apiWordsetsIdGenerateAudioPost(id);
  },

  // Results management
  async getResults() {
    const { usersApi } = await createApiInstances();
    return usersApi.apiUsersResultsGet();
  },

  async saveResult(request: ModelsSaveResultRequest) {
    const { usersApi } = await createApiInstances();
    return usersApi.apiUsersResultsPost(request);
  },

  // Family results
  async getFamilyResults() {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesResultsGet();
  },

  // Health check (doesn't require auth)
  async getHealth() {
    const { healthApi } = await createApiInstances(false);
    return healthApi.healthGet();
  },
};

export default generatedApiClient;
