"use client";

import { useEffect } from "react";

/**
 * Marks the document as hydrated after client-side hydration completes.
 * This is used to enable CSS transitions/animations only after initial load.
 */
export function HydrationMarker() {
  useEffect(() => {
    // Mark as hydrated after a brief delay to ensure all components are ready
    const timer = setTimeout(() => {
      document.documentElement.classList.add("hydrated");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
