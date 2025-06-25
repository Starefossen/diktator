"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ClientSideRouter() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Client-side routing logic can be added here if needed
      // Currently no special routing needed since test functionality is integrated into wordsets
    }
  }, [router]);

  return null; // This component doesn't render anything
}
