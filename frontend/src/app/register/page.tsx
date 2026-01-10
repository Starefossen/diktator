"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ApiUsersPostRequest } from "@/generated";
import { generatedApiClient } from "@/lib/api-generated";
import { useAuth } from "@/contexts/OIDCAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RegisterPage() {
  const {
    user,
    refreshUserData,
    loading,
    needsRegistration,
    hasPendingInvites,
    pendingInvitations,
    signIn,
  } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  // Log auth state on mount and changes
  useEffect(() => {
    console.log("[RegisterPage] Auth state changed:", {
      loading,
      user: user?.email,
      needsRegistration,
      hasPendingInvites,
      pendingInvitationsCount: pendingInvitations.length,
      pathname,
    });
  }, [
    loading,
    user,
    needsRegistration,
    hasPendingInvites,
    pendingInvitations,
    pathname,
  ]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.email);
      setEmail(user.email);
      const suggestedFamily =
        user.displayName || user.email
          ? `${user.displayName || user.email}'s Family`
          : "My Family";
      setFamilyName((prev) => prev || suggestedFamily);
    }
  }, [user]);

  // Only redirect away if registration is complete (needsRegistration is false)
  // AND we're not in a loading state AND user exists with valid email
  // AND there are no pending invites
  useEffect(() => {
    console.log(
      "[RegisterPage] Redirect check: loading=",
      loading,
      "user=",
      user?.email,
      "needsRegistration=",
      needsRegistration,
      "hasPendingInvites=",
      hasPendingInvites,
    );
    if (
      !loading &&
      user &&
      user.email &&
      !needsRegistration &&
      !hasPendingInvites
    ) {
      console.log(
        "[RegisterPage] All conditions met for redirect! Redirecting away...",
      );
      const redirect =
        sessionStorage.getItem("post_registration_redirect") || "/wordsets/";
      console.log("[RegisterPage] Redirecting to:", redirect);
      sessionStorage.removeItem("post_registration_redirect");
      router.replace(redirect);
    } else {
      console.log("[RegisterPage] Not redirecting. Conditions:", {
        loading,
        hasUser: !!user,
        userHasEmail: !!user?.email,
        needsRegistration,
        hasPendingInvites,
      });
    }
  }, [loading, needsRegistration, hasPendingInvites, router, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("[RegisterPage] handleSubmit: Starting form submission");
    if (!user) {
      console.log("[RegisterPage] handleSubmit: No user, signing in");
      await signIn();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const trimmedDisplayName = displayName.trim() || email.trim();
      const trimmedEmail = email.trim();
      const trimmedFamilyName = familyName.trim();

      if (!trimmedDisplayName || !trimmedEmail || !trimmedFamilyName) {
        console.log("[RegisterPage] handleSubmit: Validation failed", {
          displayName: !!trimmedDisplayName,
          email: !!trimmedEmail,
          familyName: !!trimmedFamilyName,
        });
        setError(t("auth.register.error.allFieldsRequired"));
        setSubmitting(false);
        return;
      }

      const payload: ApiUsersPostRequest & { familyName?: string } = {
        displayName: trimmedDisplayName,
        role: "parent",
        email: trimmedEmail,
        familyName: trimmedFamilyName,
      };

      console.log("[RegisterPage] handleSubmit: Creating user", payload);
      await generatedApiClient.createUser(payload);

      console.log("[RegisterPage] handleSubmit: User created, refreshing data");
      await refreshUserData();

      const redirect =
        sessionStorage.getItem("post_registration_redirect") || "/wordsets/";
      sessionStorage.removeItem("post_registration_redirect");
      console.log(
        "[RegisterPage] handleSubmit: Registration complete, redirecting to:",
        redirect,
      );
      router.push(redirect);
    } catch (err) {
      console.error("[RegisterPage] Registration failed", err);
      setError(t("auth.register.error.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    console.log(
      "[RegisterPage] handleAcceptInvitation: Starting",
      invitationId,
    );
    setAcceptingInvite(true);
    setError(null);

    try {
      await generatedApiClient.acceptInvitation(invitationId);
      console.log("[RegisterPage] handleAcceptInvitation: Invitation accepted");
      await refreshUserData();

      const redirect =
        sessionStorage.getItem("post_registration_redirect") || "/wordsets/";
      sessionStorage.removeItem("post_registration_redirect");
      console.log(
        "[RegisterPage] handleAcceptInvitation: Redirecting to:",
        redirect,
      );
      router.push(redirect);
    } catch (err) {
      console.error("[RegisterPage] Invitation acceptance failed", err);
      setError(t("auth.register.error.invitationFailed"));
    } finally {
      setAcceptingInvite(false);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nordic-sky"></div>
          <p className="mt-4 text-gray-600">{t("auth.register.loading")}</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show sign in button
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <h1 className="text-xl font-semibold mb-4">
            {t("auth.register.signinPrompt")}
          </h1>
          <button
            onClick={signIn}
            className="w-full px-4 py-2 bg-nordic-sky text-white rounded hover:bg-nordic-sky/90"
          >
            {t("auth.register.signinButton")}
          </button>
        </div>
      </div>
    );
  }

  // If user is authenticated but doesn't need registration, they shouldn't be here
  // (the useEffect above will redirect them, but show loading in the meantime)
  if (!needsRegistration && !hasPendingInvites) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-nordic-sky"></div>
          <p className="mt-4 text-gray-600">{t("auth.register.redirecting")}</p>
        </div>
      </div>
    );
  }

  // User has pending family invitations - show invitation acceptance UI
  if (hasPendingInvites && pendingInvitations.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <h1 className="text-xl font-semibold mb-2">
            {t("auth.invitations.title")}
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            {t("auth.invitations.subtitle")}
          </p>
          {error ? (
            <p className="text-sm text-red-600 mb-4" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{invitation.familyName}</p>
                  <p className="text-sm text-gray-600">
                    {t("auth.invitations.role")}: {invitation.role}
                  </p>
                </div>
                <button
                  onClick={() => handleAcceptInvitation(invitation.id)}
                  disabled={acceptingInvite}
                  className="px-4 py-2 bg-nordic-sky text-white rounded hover:bg-nordic-sky/90 disabled:opacity-50"
                >
                  {acceptingInvite
                    ? t("auth.invitations.accepting")
                    : t("auth.invitations.accept")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and needs registration - show the form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-2">
          {t("auth.register.title")}
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          {t("auth.register.subtitle")}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("auth.displayName")}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("auth.displayName.placeholder")}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email.placeholder")}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("auth.register.familyName")}
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={t("auth.register.familyName.placeholder")}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-nordic-sky text-white rounded hover:bg-nordic-sky/90 disabled:opacity-50"
          >
            {submitting
              ? t("auth.register.button.submitting")
              : t("auth.register.button")}
          </button>
        </form>
      </div>
    </div>
  );
}
