/**
 * API Error Handler - Provides better error handling for API calls
 * including specific handling for auth-related errors
 */

export interface ApiError {
  message: string;
  isAuthError: boolean;
  statusCode?: number;
  shouldRetry: boolean;
}

export function handleApiError(error: unknown): ApiError {
  // Handle auth-related errors
  if (error instanceof Error) {
    if (error.message.includes("User not authenticated")) {
      return {
        message: "Please sign in to access this feature",
        isAuthError: true,
        shouldRetry: false,
      };
    }

    if (error.message.includes("Authentication failed")) {
      return {
        message: "Authentication expired. Please sign in again",
        isAuthError: true,
        shouldRetry: false,
      };
    }
  }

  // Handle API response errors
  if (error && typeof error === "object" && "response" in error) {
    const apiError = error as {
      response?: {
        status?: number;
        data?: { error?: string; message?: string };
      };
    };

    const statusCode = apiError.response?.status;
    const errorMessage =
      apiError.response?.data?.error || apiError.response?.data?.message;

    if (statusCode === 401) {
      return {
        message: "Authentication required. Please sign in again",
        isAuthError: true,
        statusCode,
        shouldRetry: false,
      };
    }

    if (statusCode === 403) {
      return {
        message: "You don't have permission to access this resource",
        isAuthError: true,
        statusCode,
        shouldRetry: false,
      };
    }

    if (statusCode === 429) {
      return {
        message: "Too many requests. Please wait a moment and try again",
        isAuthError: false,
        statusCode,
        shouldRetry: true,
      };
    }

    if (statusCode && statusCode >= 500) {
      return {
        message: "Server error. Please try again later",
        isAuthError: false,
        statusCode,
        shouldRetry: true,
      };
    }

    return {
      message: errorMessage || `API error (${statusCode})`,
      isAuthError: false,
      statusCode,
      shouldRetry: false,
    };
  }

  // Handle network errors
  if (error && typeof error === "object" && "message" in error) {
    const networkError = error as { message: string };
    if (
      networkError.message.includes("Network") ||
      networkError.message.includes("fetch")
    ) {
      return {
        message: "Network error. Please check your connection",
        isAuthError: false,
        shouldRetry: true,
      };
    }
  }

  // Default error
  return {
    message: "An unexpected error occurred",
    isAuthError: false,
    shouldRetry: false,
  };
}
