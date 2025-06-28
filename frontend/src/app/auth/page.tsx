"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";
import LoadingSpinner from "@/components/LoadingSpinner";

// Force dynamic rendering for this page since it uses client-side authentication
export const dynamic = "force-dynamic";

function AuthFormWrapper() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { clearError } = useAuth();

  const toggleMode = () => {
    // Clear any existing errors when switching modes
    clearError();
    setIsSignUp(!isSignUp);
  };

  return <AuthForm onToggleMode={toggleMode} isSignUp={isSignUp} />;
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthFormWrapper />
    </Suspense>
  );
}
