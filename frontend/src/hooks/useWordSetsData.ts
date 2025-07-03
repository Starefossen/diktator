import { useState, useEffect, useCallback } from "react";
import { WordSet } from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import {
  ModelsCreateWordSetRequest,
  ModelsUpdateWordSetRequest,
} from "@/generated";

export interface UseWordSetsDataReturn {
  wordSets: WordSet[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  loadWordSets: () => Promise<void>;
  createWordSet: (data: ModelsCreateWordSetRequest) => Promise<void>;
  updateWordSet: (
    id: string,
    data: ModelsUpdateWordSetRequest,
  ) => Promise<void>;
  deleteWordSet: (id: string) => Promise<void>;
}

export function useWordSetsData(): UseWordSetsDataReturn {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadWordSets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await generatedApiClient.getWordSets();
      if (response.data?.data) {
        setWordSets(response.data.data as WordSet[]);
      }
    } catch (error) {
      console.error("Failed to load word sets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWordSet = useCallback(
    async (data: ModelsCreateWordSetRequest) => {
      try {
        setCreating(true);
        const response = await generatedApiClient.createWordSet(data);
        if (response.data?.data) {
          setWordSets((prev) => [response.data.data as WordSet, ...prev]);
        }
      } catch (error) {
        console.error("Failed to create word set:", error);
        throw error;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  const updateWordSet = useCallback(
    async (id: string, data: ModelsUpdateWordSetRequest) => {
      try {
        setUpdating(true);
        const response = await generatedApiClient.updateWordSet(id, data);
        if (response.data?.data) {
          setWordSets((prev) =>
            prev.map((ws) =>
              ws.id === id ? (response.data.data as WordSet) : ws,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to update word set:", error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  const deleteWordSet = useCallback(async (id: string) => {
    try {
      setDeleting(true);
      await generatedApiClient.deleteWordSet(id);
      setWordSets((prev) => prev.filter((ws) => ws.id !== id));
    } catch (error) {
      console.error("Failed to delete word set:", error);
      throw error;
    } finally {
      setDeleting(false);
    }
  }, []);

  // Auto-refresh for pending audio processing
  useEffect(() => {
    const hasPendingAudio = wordSets.some(
      (ws) => ws.audioProcessing === "pending",
    );

    if (hasPendingAudio) {
      const interval = setInterval(loadWordSets, 5000);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [wordSets, loadWordSets]);

  useEffect(() => {
    loadWordSets();
  }, [loadWordSets]);

  return {
    wordSets,
    loading,
    creating,
    updating,
    deleting,
    loadWordSets,
    createWordSet,
    updateWordSet,
    deleteWordSet,
  };
}
