"use client";

import { useState } from "react";
import AuthForm from "@/components/AuthForm";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return <AuthForm onToggleMode={toggleMode} isSignUp={isSignUp} />;
}
