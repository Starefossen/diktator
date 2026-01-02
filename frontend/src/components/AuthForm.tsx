"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { isMockMode } from "@/lib/oidc";

export default function AuthForm() {
  const { signIn, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isMockMode) {
      const redirectParam = searchParams.get("redirect");
      const redirectTo =
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//") &&
        !redirectParam.includes("..")
          ? redirectParam
          : "/wordsets/";

      signIn().then(() => router.push(redirectTo));
    }
  }, [signIn, router, searchParams]);

  const handleOIDCLogin = async () => {
    clearError();
    setIsSubmitting(true);

    try {
      const redirectParam = searchParams.get("redirect");
      if (
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//")
      ) {
        sessionStorage.setItem("post_auth_redirect", redirectParam);
      }

      await signIn();
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isMockMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-purple-600">
              <span className="text-2xl font-bold text-white">D</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome to Diktator
          </h2>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>

        <div className="p-8 mt-8 space-y-6 bg-white shadow-lg rounded-xl">
          {error && (
            <div className="p-4 border border-red-200 rounded-md bg-red-50">
              <div className="flex items-start">
                <div className="shrink-0">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleOIDCLogin}
            disabled={isSubmitting}
            className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-medium text-white transition-all duration-200 border border-transparent rounded-md shadow-sm bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Login with OIDC</span>
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            You will be redirected to your identity provider to complete the
            login
          </p>
        </div>
      </div>
    </div>
  );
}
