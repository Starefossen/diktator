"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  WordSet,
  validateTestConfiguration,
  TestResult,
  FamilyProgress,
} from "@/types";
import {
  ModelsUpdateWordSetRequest,
  ModelsCreateWordSetRequest,
} from "@/generated";
import { playWordAudio as playWordAudioHelper } from "@/lib/audioPlayer";
import { generatedApiClient } from "@/lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";
import WordSetEditor from "@/components/WordSetEditor";
import { WordSetsListView } from "@/components/WordSetsListView";
import { TestView } from "@/components/TestView";
import { PracticeView } from "@/components/PracticeView";
import { TestResultsView } from "@/components/TestResultsView";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { HeroPlusIcon } from "@/components/Icons";

// Custom hooks
import { useWordSetsData } from "@/hooks/useWordSetsData";
import { useTestMode } from "@/hooks/useTestMode";
import { usePracticeMode } from "@/hooks/usePracticeMode";
import { useModalState } from "@/hooks/useModalState";

export default function WordSetsPage() {
  const { t } = useLanguage();
  const { userData } = useAuth();

  // Data management
  const {
    wordSets,
    loading,
    creating,
    updating,
    deleting,
    createWordSet,
    updateWordSet,
    deleteWordSet,
  } = useWordSetsData();

  // Personalization data
  const [userResults, setUserResults] = useState<TestResult[]>([]);
  const [familyProgress, setFamilyProgress] = useState<FamilyProgress[]>([]);
  const [personalizationLoading, setPersonalizationLoading] = useState(false);

  // Test mode management
  const testMode = useTestMode();

  // Practice mode management
  const practiceMode = usePracticeMode();

  // UI state management
  const modalState = useModalState();

  // Audio state for word list
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Load personalization data when component mounts or userData changes
  useEffect(() => {
    const loadPersonalizationData = async () => {
      if (!userData) return;

      try {
        setPersonalizationLoading(true);

        if (userData.role === "child") {
          // Load user's test results for personalization
          const resultsResponse = await generatedApiClient.getResults();
          if (resultsResponse.data?.data) {
            setUserResults(resultsResponse.data.data as TestResult[]);
          }
        } else if (userData.role === "parent") {
          // Load family progress for parent view
          const progressResponse = await generatedApiClient.getFamilyProgress();
          if (progressResponse.data?.data) {
            setFamilyProgress(progressResponse.data.data as FamilyProgress[]);
          }
        }
      } catch (error) {
        console.error("Failed to load personalization data:", error);
      } finally {
        setPersonalizationLoading(false);
      }
    };

    loadPersonalizationData();
  }, [userData]);

  // Word click handler for audio playback
  const handleWordClick = useCallback(
    async (word: string, wordSet: WordSet) => {
      const wordItem = wordSet.words.find((w) => w.word === word);
      if (!wordItem?.audio?.audioId) {
        return; // No audio available
      }

      setPlayingAudio(word);

      await playWordAudioHelper(word, wordSet, {
        onEnd: () => setPlayingAudio(null),
        onError: (error: Error) => {
          setPlayingAudio(null);
          console.error("Failed to play audio for word:", word, error);
        },
      });
    },
    [],
  );

  // Settings save handler
  const handleSaveSettings = useCallback(async () => {
    if (!modalState.settingsWordSet) return;

    try {
      const validatedConfig = validateTestConfiguration(
        modalState.settingsConfig,
      );
      // TODO: Implement API call to update wordset configuration
      console.log(
        "Saving settings for wordset:",
        modalState.settingsWordSet.id,
        validatedConfig,
      );

      modalState.closeSettingsModal();
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [modalState]);

  // Editor handlers
  const handleCreateSave = useCallback(
    async (data: ModelsCreateWordSetRequest) => {
      try {
        await createWordSet(data);
        modalState.closeCreateForm();
        console.log("Word set created successfully");
      } catch (error) {
        console.error("Failed to create word set:", error);
        throw new Error(t("wordsets.createError"));
      }
    },
    [createWordSet, modalState, t],
  );

  const handleEditSave = useCallback(
    async (data: ModelsUpdateWordSetRequest) => {
      if (!modalState.editingWordSet) return;

      try {
        await updateWordSet(modalState.editingWordSet.id, data);
        modalState.closeEditForm();
        console.log("Word set updated successfully");
      } catch (error) {
        console.error("Failed to update word set:", error);
        throw new Error(t("wordsets.updateError"));
      }
    },
    [updateWordSet, modalState, t],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!modalState.deleteWordSet) return;

    try {
      await deleteWordSet(modalState.deleteWordSet.id);
      modalState.closeDeleteModal();
      console.log("Word set deleted successfully");
    } catch (error) {
      console.error("Failed to delete word set:", error);
    }
  }, [deleteWordSet, modalState]);

  // Cancel handler for forms
  const handleCancel = useCallback(() => {
    modalState.closeCreateForm();
    modalState.closeEditForm();
    modalState.clearFormError();
  }, [modalState]);

  // Loading state
  if (loading || personalizationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">
            {loading ? t("wordsets.loading") : "Loading personalization..."}
          </p>
        </div>
      </div>
    );
  }

  // Practice mode view
  if (practiceMode.practiceMode && practiceMode.practiceWords.length > 0) {
    return (
      <ProtectedRoute>
        <PracticeView
          practiceMode={practiceMode.practiceMode}
          practiceWords={practiceMode.practiceWords}
          currentPracticeIndex={practiceMode.currentPracticeIndex}
          showPracticeWord={practiceMode.showPracticeWord}
          isAudioPlaying={practiceMode.isAudioPlaying}
          onSetCurrentIndex={practiceMode.setCurrentPracticeIndex}
          onSetShowWord={practiceMode.setShowPracticeWord}
          onNext={practiceMode.nextPracticeWord}
          onPrevious={practiceMode.previousPracticeWord}
          onPlayAudio={practiceMode.playPracticeWordAudio}
          onShuffle={practiceMode.shufflePracticeWords}
          onStartTest={testMode.startTest}
          onExit={practiceMode.exitPractice}
        />
      </ProtectedRoute>
    );
  }

  // Test results view
  if (testMode.activeTest && testMode.showResult) {
    return (
      <ProtectedRoute>
        <TestResultsView
          activeTest={testMode.activeTest}
          answers={testMode.answers}
          onRestart={testMode.restartTest}
          onExit={testMode.exitTest}
          onPlayAudio={testMode.playTestWordAudio}
        />
      </ProtectedRoute>
    );
  }

  // Test interface view
  if (testMode.activeTest && !testMode.showResult) {
    return (
      <ProtectedRoute>
        <TestView
          activeTest={testMode.activeTest}
          currentWordIndex={testMode.currentWordIndex}
          processedWords={testMode.processedWords}
          userAnswer={testMode.userAnswer}
          showFeedback={testMode.showFeedback}
          lastAnswerCorrect={testMode.lastAnswerCorrect}
          currentTries={testMode.currentTries}
          answers={testMode.answers}
          isAudioPlaying={testMode.isAudioPlaying}
          onUserAnswerChange={testMode.setUserAnswer}
          onSubmitAnswer={testMode.handleSubmitAnswer}
          onPlayCurrentWord={testMode.playCurrentWord}
          onExitTest={testMode.exitTest}
        />
      </ProtectedRoute>
    );
  }

  // Main word sets list view
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              {t("wordsets.title")}
            </h1>
            <p className="text-lg text-gray-600">{t("wordsets.subtitle")}</p>
          </div>

          {/* Create New Word Set Button */}
          <div className="mb-8">
            <button
              onClick={modalState.openCreateForm}
              className="flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl hover:scale-105"
            >
              <HeroPlusIcon className="w-5 h-5 mr-2" />
              {t("wordsets.create")}
            </button>
          </div>

          {/* Create Form */}
          {modalState.showCreateForm && (
            <WordSetEditor
              mode="create"
              onSave={handleCreateSave}
              onCancel={handleCancel}
              isLoading={creating}
              error={modalState.formError}
            />
          )}

          {/* Word Sets List */}
          <WordSetsListView
            wordSets={wordSets}
            playingAudio={playingAudio}
            userResults={userResults}
            familyProgress={familyProgress}
            onStartTest={testMode.startTest}
            onStartPractice={practiceMode.startPractice}
            onWordClick={handleWordClick}
            onOpenSettings={modalState.openSettingsModal}
            onOpenEdit={modalState.openEditForm}
            onOpenDelete={modalState.openDeleteModal}
          />
        </div>

        {/* Settings Modal */}
        {modalState.showSettingsModal && modalState.settingsWordSet && (
          <SettingsModal
            wordSet={modalState.settingsWordSet}
            config={modalState.settingsConfig}
            onConfigChange={modalState.setSettingsConfig}
            onSave={handleSaveSettings}
            onCancel={modalState.closeSettingsModal}
          />
        )}

        {/* Edit WordSet Modal */}
        {modalState.showEditForm && modalState.editingWordSet && (
          <WordSetEditor
            mode="edit"
            initialData={modalState.editingWordSet}
            onSave={handleEditSave}
            onCancel={handleCancel}
            isLoading={updating}
            error={modalState.formError}
          />
        )}

        {/* Delete Confirmation Modal */}
        {modalState.showDeleteModal && modalState.deleteWordSet && (
          <DeleteConfirmationModal
            wordSet={modalState.deleteWordSet}
            isDeleting={deleting}
            onConfirm={handleDeleteConfirm}
            onCancel={modalState.closeDeleteModal}
          />
        )}

        {/* Footer */}
        <footer className="pb-4 mt-12 text-center">
          <div className="text-xs text-gray-400">
            Build:{" "}
            {process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()}
            {process.env.NODE_ENV === "development" && " (dev)"}
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
