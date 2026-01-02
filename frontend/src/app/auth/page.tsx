"use client";

import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import LoadingSpinner from "@/components/LoadingSpinner";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthForm />
    </Suspense>
  );
}
