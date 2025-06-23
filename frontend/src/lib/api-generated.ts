/**
 * API client shim that provides user-friendly method names and automatic authentication
 * This wraps the generated OpenAPI client with Firebase authentication
 */

import { auth } from "@/lib/firebase";
import {
  Configuration,
  ChildrenApi,
  FamiliesApi,
  HealthApi,
  ResultsApi,
  UsersApi,
  WordsetsApi,
  ModelsCreateChildAccountRequest,
  ModelsSaveResultRequest,
  ApiUsersPostRequest,
  ModelsCreateWordSetRequest,
  ModelsChildAccount,
} from "@/generated";

// Create a configuration that automatically includes Firebase auth token
const createConfiguration = async (): Promise<Configuration> => {
  const user = auth.currentUser;
  let authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (user) {
    try {
      const idToken = await user.getIdToken();
      authHeaders["Authorization"] = `Bearer ${idToken}`;
    } catch (error) {
      console.error("Failed to get Firebase auth token:", error);
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
const createApiInstances = async () => {
  const config = await createConfiguration();

  return {
    childrenApi: new ChildrenApi(config),
    familiesApi: new FamiliesApi(config),
    healthApi: new HealthApi(config),
    resultsApi: new ResultsApi(config),
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
    const { resultsApi } = await createApiInstances();
    return resultsApi.apiResultsGet();
  },

  async saveResult(request: ModelsSaveResultRequest) {
    const { resultsApi } = await createApiInstances();
    return resultsApi.apiResultsPost(request);
  },

  // Health check
  async getHealth() {
    const { healthApi } = await createApiInstances();
    return healthApi.healthGet();
  },
};

export default generatedApiClient;
