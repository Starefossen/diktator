/**
 * API client shim that provides user-friendly method names and automatic authentication
 * This wraps the generated OpenAPI client with OIDC authentication
 */

import { getIdToken, isMockMode, getMockToken } from "@/lib/oidc";
import { OpenAPI } from "@/generated/core/OpenAPI";
import {
  ChildrenService,
  DictionaryService,
  FamiliesService,
  HealthService,
  InvitationsService,
  MasteryService,
  UsersService,
  WordsetsService,
  models_SaveResultRequest,
  models_CreateWordSetRequest,
  models_UpdateWordSetRequest,
  models_AddFamilyMemberRequest,
  models_UpdateChildBirthYearRequest,
} from "@/generated";
import type { models_APIResponse as _models_APIResponse } from "@/generated";

// Configure OpenAPI with automatic authentication
const setupAuth = async (requireAuth = true): Promise<void> => {
  // Set base URL (without /api since generated service methods include full paths)
  OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  // Remove trailing /api if present (generated code already includes /api in paths)
  if (OpenAPI.BASE.endsWith("/api")) {
    OpenAPI.BASE = OpenAPI.BASE.slice(0, -4);
  }

  if (requireAuth) {
    // Use ID token for API authentication (has correct audience claim from Zitadel)
    // Access tokens from Zitadel may not include the client ID in aud claim
    let token = isMockMode ? getMockToken() : getIdToken();

    // If no token initially, wait briefly for auth to complete (max 2 seconds)
    if (!token && !isMockMode) {
      for (let i = 0; i < 20; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        token = getIdToken();
        if (token) break;
      }
    }

    if (token) {
      OpenAPI.TOKEN = token;
      console.log("[API] Token configured, BASE:", OpenAPI.BASE);
    } else if (!isMockMode) {
      console.error("[API] User not authenticated");
      throw new Error("User not authenticated");
    }
  } else {
    OpenAPI.TOKEN = undefined;
    console.log("[API] No auth required, BASE:", OpenAPI.BASE);
  }
};

// Main API client with user-friendly method names
export const generatedApiClient = {
  // User management
  async getUserProfile() {
    await setupAuth();
    return UsersService.getApiUsersProfile();
  },

  async updateUserDisplayName(request: { displayName: string }) {
    await setupAuth();
    return UsersService.patchApiUsersMeName(request);
  },

  async createUser(request: {
    authId: string;
    email: string;
    displayName: string;
  }) {
    await setupAuth();
    return UsersService.postApiUsers(request);
  },

  // Family management
  async getFamilyChildren() {
    await setupAuth();
    return FamiliesService.getApiFamiliesChildren();
  },

  async getFamilyProgress() {
    await setupAuth();
    return FamiliesService.getApiFamiliesProgress();
  },

  async getFamilyStats() {
    await setupAuth();
    return FamiliesService.getApiFamiliesStats();
  },

  async getFamily() {
    await setupAuth();
    return FamiliesService.getApiFamilies();
  },

  async getFamilyInvitations() {
    await setupAuth();
    return FamiliesService.getApiFamiliesInvitations();
  },

  async deleteFamilyInvitation(invitationId: string) {
    await setupAuth();
    return FamiliesService.deleteApiFamiliesInvitations(invitationId);
  },

  async removeFamilyMember(userId: string) {
    await setupAuth();
    return FamiliesService.deleteApiFamiliesMembers(userId);
  },

  // Invitation management
  async getPendingInvitations() {
    await setupAuth();
    return InvitationsService.getApiInvitationsPending();
  },

  async acceptInvitation(invitationId: string) {
    await setupAuth();
    return InvitationsService.postApiInvitationsAccept(invitationId);
  },

  // Child account management
  async createChildAccount(request: models_AddFamilyMemberRequest) {
    await setupAuth();
    return FamiliesService.postApiFamiliesMembers(request);
  },

  async addFamilyMember(request: models_AddFamilyMemberRequest) {
    await setupAuth();
    return FamiliesService.postApiFamiliesMembers(request);
  },

  async deleteChildAccount(childId: string) {
    await setupAuth();
    return ChildrenService.deleteApiFamiliesChildren(childId);
  },

  async updateChildDisplayName(
    childId: string,
    request: { displayName: string },
  ) {
    await setupAuth();
    return ChildrenService.putApiFamiliesChildren(childId, request);
  },

  async getChildProgress(childId: string) {
    await setupAuth();
    return ChildrenService.getApiFamiliesChildrenProgress(childId);
  },

  async getChildResults(childId: string) {
    await setupAuth();
    return ChildrenService.getApiFamiliesChildrenResults(childId);
  },

  async updateChildBirthYear(
    childId: string,
    request: models_UpdateChildBirthYearRequest,
  ) {
    await setupAuth();
    return ChildrenService.patchApiFamiliesChildrenBirthyear(childId, request);
  },

  // Word sets management
  async getWordSets() {
    await setupAuth();
    return WordsetsService.getApiWordsets();
  },

  async getCuratedWordSets() {
    await setupAuth();
    return WordsetsService.getApiWordsetsCurated();
  },

  async createWordSet(request: models_CreateWordSetRequest) {
    await setupAuth();
    return WordsetsService.postApiWordsets(request);
  },

  async updateWordSet(id: string, request: models_UpdateWordSetRequest) {
    await setupAuth();
    return WordsetsService.putApiWordsets(id, request);
  },

  async deleteWordSet(id: string) {
    await setupAuth();
    return WordsetsService.deleteApiWordsets(id);
  },

  async assignWordSetToUser(wordSetId: string, userId: string) {
    await setupAuth();
    return WordsetsService.postApiWordsetsAssignments(wordSetId, userId);
  },

  async unassignWordSetFromUser(wordSetId: string, userId: string) {
    await setupAuth();
    return WordsetsService.deleteApiWordsetsAssignments(wordSetId, userId);
  },

  // Results management
  async getResults() {
    await setupAuth();
    return UsersService.getApiUsersResults();
  },

  async saveResult(request: models_SaveResultRequest) {
    await setupAuth();
    return UsersService.postApiUsersResults(request);
  },

  // Family results
  async getFamilyResults() {
    await setupAuth();
    return FamiliesService.getApiFamiliesResults();
  },

  // Health check (doesn't require auth)
  async getHealth() {
    await setupAuth(false);
    return HealthService.getHealth();
  },

  // Mastery management
  async getWordSetMastery(wordSetId: string) {
    await setupAuth();
    return MasteryService.getApiMastery(wordSetId);
  },

  // Dictionary services
  async validateWord(word: string, dict?: string) {
    await setupAuth();
    return DictionaryService.getApiDictionaryValidate(word, dict);
  },

  async suggestWords(query: string, dict?: string, limit?: number) {
    await setupAuth();
    return DictionaryService.getApiDictionarySuggest(query, dict, limit);
  },

  async getDictionaryStats() {
    await setupAuth();
    return DictionaryService.getApiDictionaryStats();
  },
};
