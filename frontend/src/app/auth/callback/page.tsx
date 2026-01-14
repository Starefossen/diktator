"use client";

import { logger } from "@/lib/logger";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleCallback, getReturnUrl, isMockMode } from "@/lib/oidc";
import { useLanguage } from "@/contexts/LanguageContext";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      // In mock mode, just redirect to home
      if (isMockMode) {
        router.push("/");
        return;
      }

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Check for error from OIDC provider
      if (errorParam) {
        setError(errorDescription || errorParam);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setError("Missing authorization code or state parameter");
        return;
      }

      try {
        await handleCallback(code, state);

        // Wait briefly for localStorage to commit and trigger storage event
        // This ensures AuthContext can sync before we navigate
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Trigger storage event for same-tab synchronization
        window.dispatchEvent(new Event("storage"));

        // Get return URL from session storage or OIDC lib, or default to wordsets
        const sessionRedirect = sessionStorage.getItem("post_auth_redirect");
        sessionStorage.removeItem("post_auth_redirect");
        const returnTo = sessionRedirect || getReturnUrl() || "/wordsets/";

        router.push(returnTo);
      } catch (err) {
        logger.auth.error("Callback error", { error: err });
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    }

    processCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {t("auth.callback.error")}
            </h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push("/auth")}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-nordic-sky hover:bg-nordic-sky/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nordic-teal"
            >
              {t("auth.callback.tryAgain")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nordic-sky mx-auto"></div>
        <p className="mt-4 text-gray-600">{t("auth.callback.completing")}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nordic-sky mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {/* i18n-ignore - Suspense fallback cannot use hooks */}
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
