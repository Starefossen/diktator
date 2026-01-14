import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WordSet } from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import {
  models_CreateWordSetRequest,
  models_UpdateWordSetRequest,
} from "@/generated";

export interface UseWordSetsDataReturn {
  wordSets: WordSet[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  loadWordSets: () => Promise<void>;
  createWordSet: (data: models_CreateWordSetRequest) => Promise<WordSet | null>;
  updateWordSet: (
    id: string,
    data: models_UpdateWordSetRequest,
  ) => Promise<void>;
  deleteWordSet: (id: string) => Promise<void>;
}

export function useWordSetsData(): UseWordSetsDataReturn {
  const { needsRegistration } = useAuth();
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadWordSets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await generatedApiClient.getWordSets();
      if (response.data) {
        setWordSets(response.data as WordSet[]);
      }
    } catch (error) {
      console.error("Failed to load word sets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWordSet = useCallback(
    async (data: models_CreateWordSetRequest): Promise<WordSet | null> => {
      try {
        setCreating(true);
        const response = await generatedApiClient.createWordSet(data);
        if (response.data) {
          const newWordSet = response.data as WordSet;
          setWordSets((prev) => [newWordSet, ...prev]);
          return newWordSet;
        }
        return null;
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
    async (id: string, data: models_UpdateWordSetRequest) => {
      try {
        setUpdating(true);
        const response = await generatedApiClient.updateWordSet(id, data);
        if (response.data) {
          setWordSets((prev) =>
            prev.map((ws) => (ws.id === id ? (response.data as WordSet) : ws)),
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

  useEffect(() => {
    // Skip loading wordsets if user needs registration (not yet in database)
    if (needsRegistration) {
      setLoading(false);
      return;
    }
    loadWordSets();
  }, [loadWordSets, needsRegistration]);

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
