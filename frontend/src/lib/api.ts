// API client for our Go backend with Phase 2 features

import {
  ApiResponse,
  WordSet,
  TestResult,
  CreateWordSetRequest,
  SaveResultRequest,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Helper to get URL with query params (temporary - until we have proper auth)
  private getUrlWithParams(
    endpoint: string,
    params: Record<string, string>,
  ): string {
    const url = new URL(endpoint, API_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  }

  // Health check
  async healthCheck(): Promise<
    ApiResponse<{ status: string; service: string; time: string }>
  > {
    return this.request("/health");
  }

  // Word sets
  async getWordSets(familyId: string): Promise<ApiResponse<WordSet[]>> {
    const url = this.getUrlWithParams("/api/wordsets", { familyId });
    return fetch(url).then((res) => res.json());
  }

  async createWordSet(
    data: CreateWordSetRequest,
    familyId: string,
    userId: string,
  ): Promise<ApiResponse<WordSet>> {
    const url = this.getUrlWithParams("/api/wordsets", { familyId, userId });
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json());
  }

  async deleteWordSet(id: string): Promise<ApiResponse<null>> {
    return this.request(`/api/wordsets/${id}`, {
      method: "DELETE",
    });
  }

  async generateAudio(wordSetId: string): Promise<ApiResponse<null>> {
    return this.request(`/api/wordsets/${wordSetId}/audio`, {
      method: "POST",
    });
  }

  // Test results
  async getResults(userId: string): Promise<ApiResponse<TestResult[]>> {
    const url = this.getUrlWithParams("/api/results", { userId });
    return fetch(url).then((res) => res.json());
  }

  async saveResult(
    data: SaveResultRequest,
    userId: string,
  ): Promise<ApiResponse<TestResult>> {
    const url = this.getUrlWithParams("/api/results", { userId });
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json());
  }
}

export const apiClient = new ApiClient();
