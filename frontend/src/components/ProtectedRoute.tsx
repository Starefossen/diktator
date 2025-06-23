"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingPage } from "@/components/LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If user is not authenticated, redirect to auth page instead of rendering it inline
  // This prevents React state update errors during logout
  useEffect(() => {
    if (!loading && !user) {
      // Include current path as redirect parameter
      const currentPath = window.location.pathname;
      const redirectUrl =
        currentPath !== "/"
          ? `/auth?redirect=${encodeURIComponent(currentPath)}`
          : "/auth";
      router.push(redirectUrl);
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth state
  if (loading) {
    return <LoadingPage />;
  }

  // If not authenticated, show loading while redirect happens
  if (!user) {
    return <LoadingPage />;
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}
