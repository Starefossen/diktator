"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { clearError } = useAuth();

  const toggleMode = () => {
    // Clear any existing errors when switching modes
    clearError();
    setIsSignUp(!isSignUp);
  };

  return <AuthForm onToggleMode={toggleMode} isSignUp={isSignUp} />;
}
