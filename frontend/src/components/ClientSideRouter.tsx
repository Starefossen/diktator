"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ClientSideRouter() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;

      // Handle /test/[id] routes by redirecting to /test?id=[id]
      const testRouteMatch = pathname.match(/^\/test\/([^\/]+)$/);
      if (testRouteMatch) {
        const testId = testRouteMatch[1];
        router.replace(`/test?id=${testId}`);
      }
    }
  }, [router]);

  return null; // This component doesn't render anything
}
