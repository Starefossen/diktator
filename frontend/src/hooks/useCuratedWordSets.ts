import { useState, useEffect, useCallback } from "react";
import { WordSet } from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import { logger } from "@/lib/logger";

export interface UseCuratedWordSetsReturn {
  curatedWordSets: WordSet[];
  loading: boolean;
  error: Error | null;
  loadCuratedWordSets: () => Promise<void>;
}

export function useCuratedWordSets(): UseCuratedWordSetsReturn {
  const [curatedWordSets, setCuratedWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCuratedWordSets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await generatedApiClient.getCuratedWordSets();
      if (response.data) {
        setCuratedWordSets(response.data as WordSet[]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      logger.api.error("Failed to load curated word sets:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCuratedWordSets();
  }, [loadCuratedWordSets]);

  return {
    curatedWordSets,
    loading,
    error,
    loadCuratedWordSets,
  };
}
