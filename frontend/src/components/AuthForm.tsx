"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AuthFormProps {
  onToggleMode: () => void;
  isSignUp: boolean;
}

export default function AuthForm({ onToggleMode, isSignUp }: AuthFormProps) {
  const { signIn, signUp, error, clearError } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine error type for better styling
  const getErrorType = (
    errorMessage: string,
  ): "credential" | "connection" | "validation" => {
    if (!errorMessage) return "credential";

    const lowerError = errorMessage.toLowerCase();

    // Connection/service errors
    if (
      lowerError.includes("network") ||
      lowerError.includes("connection") ||
      lowerError.includes("service") ||
      lowerError.includes("emulator") ||
      lowerError.includes("firebase") ||
      lowerError.includes("development environment") ||
      lowerError.includes("timeout")
    ) {
      return "connection";
    }

    // Validation errors
    if (
      lowerError.includes("valid email") ||
      lowerError.includes("password should be") ||
      lowerError.includes("required")
    ) {
      return "validation";
    }

    // Default to credential errors
    return "credential";
  };

  const errorType = error ? getErrorType(error) : "credential";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "child" as "parent" | "child",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(
          formData.email,
          formData.password,
          formData.displayName,
          formData.role,
        );
      } else {
        await signIn(formData.email, formData.password);
      }

      // Redirect after successful authentication
      // Check if there's a redirect URL in the query params, otherwise go to wordsets
      const redirectParam = searchParams.get("redirect");
      let redirectTo = "/wordsets/";

      // Validate redirect URL to prevent open redirect vulnerabilities
      if (
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//") &&
        !redirectParam.includes("..")
      ) {
        redirectTo = redirectParam;
      }

      // Use setTimeout to defer navigation until after render is complete
      setTimeout(() => {
        router.push(redirectTo);
      }, 0);
    } catch {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    // Clear error when user starts typing
    if (error) {
      clearError();
    }

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-2xl font-bold text-white">D</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isSignUp ? t("auth.signup.title") : t("auth.signin.title")}
          </h2>
          <p className="mt-2 text-gray-600">
            {isSignUp ? t("auth.signup.subtitle") : t("auth.signin.subtitle")}
          </p>
        </div>

        <form
          className="p-8 mt-8 space-y-6 bg-white shadow-lg rounded-xl"
          onSubmit={handleSubmit}
        >
          {error && (
            <div
              className={`border rounded-md p-4 ${
                errorType === "connection"
                  ? "bg-yellow-50 border-yellow-200"
                  : errorType === "validation"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {errorType === "connection" ? (
                    <svg
                      className="w-5 h-5 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  ) : errorType === "validation" ? (
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
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
                  )}
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm ${
                      errorType === "connection"
                        ? "text-yellow-700"
                        : errorType === "validation"
                          ? "text-blue-700"
                          : "text-red-700"
                    }`}
                  >
                    {error}
                  </p>
                  {errorType === "connection" && (
                    <p className="mt-1 text-xs text-yellow-600">
                      If you&apos;re in development mode, try running:{" "}
                      <code className="px-1 bg-yellow-100 rounded">
                        mise run firebase-emulators
                      </code>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  {t("auth.displayName")}
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("auth.displayName.placeholder")}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                {t("auth.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t("auth.email.placeholder")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                {t("auth.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t("auth.password.placeholder")}
              />
            </div>

            {isSignUp && (
              <div>
                <label
                  htmlFor="role"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  {t("auth.role")}
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="child">{t("auth.role.child")}</option>
                  <option value="parent">{t("auth.role.parent")}</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all duration-200 border border-transparent rounded-md shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : isSignUp ? (
                t("auth.signup.button")
              ) : (
                t("auth.signin.button")
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-sm text-blue-600 transition-colors hover:text-blue-500"
            >
              {isSignUp
                ? t("auth.signup.switchToSignin")
                : t("auth.signin.switchToSignup")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
