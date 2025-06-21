"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingPage } from "@/components/LoadingSpinner";
import AuthPage from "@/app/auth/page";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return <LoadingPage />;
  }

  // Show auth page if user is not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}
