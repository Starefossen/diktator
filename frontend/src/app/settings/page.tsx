"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { generatedApiClient } from "@/lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SettingsPage() {
  const { userData, refreshUserData } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(userData?.displayName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedName = displayName.trim();

    // Validation
    if (!trimmedName) {
      setError(t("profile.settings.validation.required"));
      return;
    }

    if (trimmedName.length < 1) {
      setError(t("profile.settings.validation.tooShort"));
      return;
    }

    if (trimmedName.length > 100) {
      setError(t("profile.settings.validation.tooLong"));
      return;
    }

    try {
      setIsSaving(true);

      await generatedApiClient.updateUserDisplayName({
        displayName: trimmedName,
      });

      // Refresh user data to show updated name
      await refreshUserData();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update display name:", err);
      setError(t("profile.settings.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(userData?.displayName || "");
    setError(null);
    setSuccess(false);
    router.back();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-nordic-birch">
        <div className="container max-w-4xl px-4 py-8 mx-auto">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-linear-to-r from-nordic-sky to-nordic-teal bg-clip-text">
              {t("profile.settings.title")}
            </h1>
            <p className="text-lg text-gray-600">
              {t("profile.settings.displayName.help")}
            </p>
          </div>

          <div className="p-8 bg-white shadow-lg rounded-xl">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="displayName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {t("profile.settings.displayName.label")}
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("profile.settings.displayName.placeholder")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-nordic-teal focus:outline-none focus:ring-2 focus:ring-nordic-teal/30 transition-colors"
                  maxLength={100}
                  disabled={isSaving}
                />
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-600">
                  {t("profile.settings.success")}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 text-nordic-midnight transition-colors bg-nordic-sky rounded-lg hover:bg-nordic-sky/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving
                    ? t("profile.settings.saving")
                    : t("profile.settings.save")}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-6 py-3 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("profile.settings.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
