"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { generatedApiClient } from "@/lib/api-generated";

// Hook to check API status with proper auth handling
export function useApiStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't check API until auth state is determined
    if (authLoading) {
      return;
    }

    const checkApi = async () => {
      try {
        setStatus("loading");

        // Use the proper API client which handles auth correctly
        const response = await generatedApiClient.getHealth();

        if (response.data) {
          setStatus("connected");
          setMessage(response.data.message || "API is healthy");
        } else {
          setStatus("error");
          setMessage("API returned an error");
        }
      } catch (error) {
        console.error("API health check failed:", error);
        setStatus("error");
        setMessage("Could not connect to API");
      }
    };

    checkApi();
  }, [authLoading]); // Re-run when auth loading state changes

  return { status, message };
}
