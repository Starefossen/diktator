"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { isMockMode } from "@/lib/oidc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AuthForm() {
  const { signIn, error, clearError } = useAuth();
  const { user, needsRegistration, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const redirectParam = searchParams.get("redirect");
      const redirectTo =
        redirectParam &&
          redirectParam.startsWith("/") &&
          !redirectParam.startsWith("//") &&
          !redirectParam.includes("..")
          ? redirectParam
          : "/wordsets/";

      if (needsRegistration) {
        router.replace(`/register?redirect=${encodeURIComponent(redirectTo)}`);
      } else {
        router.replace(redirectTo);
      }
    }
  }, [loading, needsRegistration, router, searchParams, user]);

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
      <div className="flex items-center justify-center h-dvh overflow-hidden">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-dvh overflow-hidden px-4 bg-nordic-birch">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-linear-to-br from-nordic-sky to-nordic-teal">
              <span className="text-2xl font-bold text-white">D</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t("auth.login.title")}
          </h2>
          <p className="mt-2 text-gray-600">{t("auth.login.subtitle")}</p>
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
            className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-medium text-nordic-midnight transition-all duration-200 border border-transparent rounded-md shadow-sm bg-nordic-sky hover:bg-nordic-sky/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nordic-teal disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span>{t("auth.login.button")}</span>
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            {t("auth.login.footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
