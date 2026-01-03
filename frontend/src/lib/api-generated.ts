/**
 * API client shim that provides user-friendly method names and automatic authentication
 * This wraps the generated OpenAPI client with OIDC authentication
 */

import { getIdToken, isMockMode, mockToken } from "@/lib/oidc";
import {
  Configuration,
  ChildrenApi,
  FamiliesApi,
  HealthApi,
  InvitationsApi,
  UsersApi,
  WordsetsApi,
  ModelsSaveResultRequest,
  ApiUsersPostRequest,
  ModelsCreateWordSetRequest,
  ModelsUpdateWordSetRequest,
  ModelsChildAccount,
  ModelsAddFamilyMemberRequest,
} from "@/generated";

// Create a configuration that automatically includes OIDC auth token
const createConfiguration = async (
  requireAuth = true,
): Promise<Configuration> => {
  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    // Use ID token for API authentication (has correct audience claim from Zitadel)
    // Access tokens from Zitadel may not include the client ID in aud claim
    let token = isMockMode ? mockToken : getIdToken();

    // If no token initially, wait briefly for auth to complete (max 2 seconds)
    if (!token && !isMockMode) {
      for (let i = 0; i < 20; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        token = getIdToken();
        if (token) break;
      }
    }

    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    } else if (!isMockMode) {
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
    invitationsApi: new InvitationsApi(config),
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

  async getFamilyInvitations() {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesInvitationsGet();
  },

  async deleteFamilyInvitation(invitationId: string) {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesInvitationsInvitationIdDelete(invitationId);
  },

  async removeFamilyMember(userId: string) {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesMembersUserIdDelete(userId);
  },

  // Invitation management
  async getPendingInvitations() {
    const { invitationsApi } = await createApiInstances();
    return invitationsApi.apiInvitationsPendingGet();
  },

  async acceptInvitation(invitationId: string) {
    const { invitationsApi } = await createApiInstances();
    return invitationsApi.apiInvitationsInvitationIdAcceptPost(invitationId);
  },

  // Child account management
  async createChildAccount(request: ModelsAddFamilyMemberRequest) {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesMembersPost(request);
  },

  async addFamilyMember(request: ModelsAddFamilyMemberRequest) {
    const { familiesApi } = await createApiInstances();
    return familiesApi.apiFamiliesMembersPost(request);
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
