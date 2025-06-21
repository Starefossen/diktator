// Simple API client for our Go backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async healthCheck() {
    return this.request("/health");
  }

  // Word sets
  async getWordSets() {
    return this.request("/api/wordsets");
  }

  async createWordSet(data: { name: string; words: string[] }) {
    return this.request("/api/wordsets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteWordSet(id: string) {
    return this.request(`/api/wordsets/${id}`, {
      method: "DELETE",
    });
  }

  // Results
  async getResults() {
    return this.request("/api/results");
  }

  async saveResult(data: Record<string, unknown>) {
    return this.request("/api/results", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
