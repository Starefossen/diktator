"use client";

import { useState, useEffect } from "react";

// Simple hook to demonstrate API integration in SPA mode
export function useApiStatus() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL
            ? `${process.env.NEXT_PUBLIC_API_URL}/health`
            : "http://localhost:8080/health",
        );

        if (response.ok) {
          const data = await response.json();
          setStatus("connected");
          setMessage(data.message || "API is healthy");
        } else {
          setStatus("error");
          setMessage("API returned an error");
        }
      } catch {
        setStatus("error");
        setMessage("Could not connect to API");
      }
    };

    checkApi();
  }, []);

  return { status, message };
}
