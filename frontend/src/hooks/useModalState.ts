import { useState, useCallback } from "react";
import { WordSet, TestConfiguration, DEFAULT_TEST_CONFIG } from "@/types";

export interface UseModalStateReturn {
  // Create Form
  showCreateForm: boolean;
  openCreateForm: () => void;
  closeCreateForm: () => void;

  // Edit Form
  showEditForm: boolean;
  editingWordSet: WordSet | null;
  openEditForm: (wordSet: WordSet) => void;
  closeEditForm: () => void;

  // Settings Modal
  showSettingsModal: boolean;
  settingsWordSet: WordSet | null;
  settingsConfig: TestConfiguration;
  setSettingsConfig: (config: TestConfiguration) => void;
  openSettingsModal: (wordSet: WordSet) => void;
  closeSettingsModal: () => void;

  // Delete Modal
  showDeleteModal: boolean;
  deleteWordSet: WordSet | null;
  openDeleteModal: (wordSet: WordSet) => void;
  closeDeleteModal: () => void;

  // Form Error
  formError: string;
  setFormError: (error: string) => void;
  clearFormError: () => void;
}

export function useModalState(): UseModalStateReturn {
  // Create Form
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Edit Form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingWordSet, setEditingWordSet] = useState<WordSet | null>(null);

  // Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsWordSet, setSettingsWordSet] = useState<WordSet | null>(null);
  const [settingsConfig, setSettingsConfig] =
    useState<TestConfiguration>(DEFAULT_TEST_CONFIG);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteWordSet, setDeleteWordSet] = useState<WordSet | null>(null);

  // Form Error
  const [formError, setFormError] = useState<string>("");

  // Create Form Actions
  const openCreateForm = useCallback(() => {
    setShowCreateForm(true);
    setFormError("");
  }, []);

  const closeCreateForm = useCallback(() => {
    setShowCreateForm(false);
    setFormError("");
  }, []);

  // Edit Form Actions
  const openEditForm = useCallback((wordSet: WordSet) => {
    setEditingWordSet(wordSet);
    setShowEditForm(true);
    setFormError("");
  }, []);

  const closeEditForm = useCallback(() => {
    setShowEditForm(false);
    setEditingWordSet(null);
    setFormError("");
  }, []);

  // Settings Modal Actions
  const openSettingsModal = useCallback((wordSet: WordSet) => {
    setSettingsWordSet(wordSet);
    setSettingsConfig(wordSet.testConfiguration || DEFAULT_TEST_CONFIG);
    setShowSettingsModal(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setShowSettingsModal(false);
    setSettingsWordSet(null);
  }, []);

  // Delete Modal Actions
  const openDeleteModal = useCallback((wordSet: WordSet) => {
    setDeleteWordSet(wordSet);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteWordSet(null);
  }, []);

  // Form Error Actions
  const clearFormError = useCallback(() => {
    setFormError("");
  }, []);

  return {
    // Create Form
    showCreateForm,
    openCreateForm,
    closeCreateForm,

    // Edit Form
    showEditForm,
    editingWordSet,
    openEditForm,
    closeEditForm,

    // Settings Modal
    showSettingsModal,
    settingsWordSet,
    settingsConfig,
    setSettingsConfig,
    openSettingsModal,
    closeSettingsModal,

    // Delete Modal
    showDeleteModal,
    deleteWordSet,
    openDeleteModal,
    closeDeleteModal,

    // Form Error
    formError,
    setFormError,
    clearFormError,
  };
}
