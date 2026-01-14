import { render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { generatedApiClient } from "@/lib/api-generated";
import { AuthProvider, useAuth } from "./OIDCAuthContext";
import { LanguageProvider } from "./LanguageContext";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
  }),
}));

vi.mock("@/lib/oidc", () => ({
  isAuthenticated: () => true,
  isMockMode: false,
  getUserInfo: () =>
    Promise.resolve({
      id: "oidc-user",
      email: "parent@example.com",
      name: "Parent",
      emailVerified: true,
      picture: undefined,
    }),
  getAccessToken: () => "token",
  initiateLogin: vi.fn(),
  initiateLogout: vi.fn(),
}));

vi.mock("@/lib/api-generated", () => ({
  generatedApiClient: {
    getUserProfile: vi.fn().mockRejectedValue({
      response: { status: 404, data: { needsRegistration: true } },
    }),
  },
}));

describe("OIDCAuthContext", () => {
  const mockedGetUserProfile =
    generatedApiClient.getUserProfile as unknown as Mock;

  beforeEach(() => {
    pushMock.mockReset();
    sessionStorage.clear();
    mockedGetUserProfile.mockReset();
    mockedGetUserProfile.mockRejectedValue({
      response: { status: 404, data: { needsRegistration: true } },
    });
  });

  it("sets needsRegistration when backend signals registration required", async () => {
    const TestComponent = () => {
      const { needsRegistration } = useAuth();
      return (
        <div>{needsRegistration ? "needs-registration" : "registered"}</div>
      );
    };

    const { getByText } = render(
      <LanguageProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(getByText("needs-registration")).toBeTruthy();
    });
  });

  it("sets needsRegistration when profile response indicates needsRegistration", async () => {
    mockedGetUserProfile.mockResolvedValueOnce({
      data: { needsRegistration: true },
    });

    const TestComponent = () => {
      const { needsRegistration } = useAuth();
      return (
        <div>{needsRegistration ? "needs-registration" : "registered"}</div>
      );
    };

    const { getByText } = render(
      <LanguageProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(getByText("needs-registration")).toBeTruthy();
    });
  });
});
