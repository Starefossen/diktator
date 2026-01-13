"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  Suspense,
  useRef,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  WordSet,
  validateTestConfiguration,
  TestResult,
  FamilyProgress,
  TestMode,
} from "@/types";
import {
  ModelsUpdateWordSetRequest,
  ModelsCreateWordSetRequest,
} from "@/generated";
import { playWordAudio as playWordAudioHelper } from "@/lib/audioPlayer";
import { generatedApiClient } from "@/lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import WordSetEditor from "@/components/WordSetEditor";
import { WordSetsListView } from "@/components/WordSetsListView";
import { TestView } from "@/components/TestView";
import { PracticeView } from "@/components/PracticeView";
import { TestResultsView } from "@/components/TestResultsView";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { ModeSelectionModal } from "@/components/ModeSelectionModal";
import { StavleCompanion } from "@/components/StavleCompanion";
import { HeroPlusIcon, HeroSparklesIcon } from "@/components/Icons";

// Custom hooks
import { useWordSetsData } from "@/hooks/useWordSetsData";
import { useTestMode } from "@/hooks/useTestMode";
import { usePracticeMode } from "@/hooks/usePracticeMode";
import { useModalState } from "@/hooks/useModalState";

function WordSetsPageContent() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get query parameters for routing
  const view = searchParams.get("view"); // "test" | "practice" | null
  const wordSetId = searchParams.get("id");
  const mode = searchParams.get("mode") as TestMode | null;

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

  // Mode selection modal state
  const [modeSelectionOpen, setModeSelectionOpen] = useState(false);
  const [selectedWordSetForTest, setSelectedWordSetForTest] =
    useState<WordSet | null>(null);

  // Audio state for word list
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Track explicit exits to prevent useEffect from re-starting modes
  const isExitingRef = useRef(false);

  // Handle URL-based navigation for test/practice modes
  useEffect(() => {
    // Skip if we're in the process of exiting
    if (isExitingRef.current) {
      return;
    }

    if (view === "test" && wordSetId && mode) {
      // Find and start test
      const wordSet = wordSets.find((ws) => ws.id === wordSetId);
      if (wordSet && !testMode.activeTest) {
        testMode.startTest(wordSet, mode);
      }
    } else if (view === "practice" && wordSetId) {
      // Find and start practice
      const wordSet = wordSets.find((ws) => ws.id === wordSetId);
      if (wordSet && !practiceMode.practiceMode) {
        practiceMode.startPractice(wordSet);
      }
    }
  }, [view, wordSetId, mode, wordSets, testMode, practiceMode]);

  // Reset exiting flag when URL params clear
  useEffect(() => {
    if (!view) {
      isExitingRef.current = false;
    }
  }, [view]);

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
        preloadNext: true,
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

      // Update word set with new test configuration
      await updateWordSet(modalState.settingsWordSet.id, {
        name: modalState.settingsWordSet.name,
        language: modalState.settingsWordSet.language,
        words: modalState.settingsWordSet.words.map((w) => ({
          word: w.word,
          definition: w.definition,
          translations: w.translations,
        })),
        testConfiguration: validatedConfig as unknown as Record<
          string,
          unknown
        >,
      });

      modalState.closeSettingsModal();
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [modalState, updateWordSet]);

  // Editor handlers
  const handleCreateSave = useCallback(
    async (data: ModelsCreateWordSetRequest, pendingAssignments?: string[]) => {
      try {
        const newWordSet = await createWordSet(data);
        const newWordSetId = newWordSet?.id;

        if (
          newWordSetId &&
          pendingAssignments &&
          pendingAssignments.length > 0
        ) {
          await Promise.all(
            pendingAssignments.map((childId) =>
              generatedApiClient.assignWordSetToUser(newWordSetId, childId),
            ),
          );
        }

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
      <div className="flex items-center justify-center min-h-screen bg-nordic-birch">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-nordic-sky rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">
            {loading ? t("wordsets.loading") : "Loading personalization..."}
          </p>
        </div>
      </div>
    );
  }

  // Practice mode view (triggered by URL params)
  if (practiceMode.practiceMode && practiceMode.practiceWords.length > 0) {
    return (
      <ProtectedRoute>
        <PracticeView
          practiceMode={practiceMode.practiceMode}
          practiceWords={practiceMode.practiceWords}
          currentPracticeIndex={practiceMode.currentPracticeIndex}
          showPracticeWord={practiceMode.showPracticeWord}
          isAudioPlaying={practiceMode.isAudioPlaying}
          audioError={practiceMode.audioError}
          onSetCurrentIndex={practiceMode.setCurrentPracticeIndex}
          onSetShowWord={practiceMode.setShowPracticeWord}
          onNext={practiceMode.nextPracticeWord}
          onPrevious={practiceMode.previousPracticeWord}
          onPlayAudio={practiceMode.playPracticeWordAudio}
          onShuffle={practiceMode.shufflePracticeWords}
          onClearAudioError={practiceMode.clearAudioError}
          onStartTest={(wordSet) => {
            // Set flag to prevent useEffect from re-starting practice
            isExitingRef.current = true;
            // Exit practice and show mode selection modal
            practiceMode.exitPractice();
            setSelectedWordSetForTest(wordSet);
            setModeSelectionOpen(true);
            // Clear URL params if present
            if (view === "practice") {
              router.replace("/wordsets");
            }
          }}
          onExit={() => {
            // Set flag to prevent useEffect from re-starting practice
            isExitingRef.current = true;
            practiceMode.exitPractice();
            // Clear URL params if present
            if (view === "practice") {
              router.replace("/wordsets");
            }
          }}
        />
      </ProtectedRoute>
    );
  }

  // Test results view (triggered by URL params)
  if (testMode.activeTest && testMode.showResult) {
    return (
      <ProtectedRoute>
        <TestResultsView
          activeTest={testMode.activeTest}
          answers={testMode.answers}
          onRestart={testMode.restartTest}
          onExit={() => {
            // Set flag to prevent useEffect from re-starting test
            isExitingRef.current = true;
            testMode.exitTest();
            // Clear URL params if present
            if (view === "test") {
              router.replace("/wordsets");
            }
          }}
          onPlayAudio={testMode.playTestWordAudio}
        />
      </ProtectedRoute>
    );
  }

  // Test interface view (triggered by URL params)
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
          testMode={testMode.testMode}
          wordDirections={testMode.wordDirections}
          lastUserAnswer={testMode.lastUserAnswer}
          onUserAnswerChange={testMode.setUserAnswer}
          onSubmitAnswer={testMode.handleSubmitAnswer}
          onNextWord={testMode.handleNextWord}
          onPlayCurrentWord={testMode.playCurrentWord}
          onExitTest={() => {
            // Set flag to prevent useEffect from re-starting test
            isExitingRef.current = true;
            testMode.exitTest();
            // Clear URL params if present
            if (view === "test") {
              router.replace("/wordsets");
            }
          }}
        />
      </ProtectedRoute>
    );
  }

  // Main word sets list view
  return (
    <ProtectedRoute>
      <div className="bg-nordic-birch">
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-linear-to-r from-nordic-sky to-nordic-teal bg-clip-text">
              {t("wordsets.title")}
            </h1>
            <p className="text-lg text-gray-600">{t("wordsets.subtitle")}</p>
          </div>

          {/* Create New Word Set Button */}
          <div className="mb-8 flex flex-wrap gap-4">
            <button
              onClick={modalState.openCreateForm}
              className="flex items-center px-6 py-3 font-semibold text-nordic-midnight transition-all duration-200 rounded-lg shadow-lg bg-linear-to-r from-nordic-meadow to-nordic-sky hover:from-nordic-meadow/90 hover:to-nordic-sky/90 hover:shadow-xl hover:scale-105"
            >
              <HeroPlusIcon className="w-5 h-5 mr-2" />
              {t("wordsets.create")}
            </button>
            <Link
              href="/wordsets/curated"
              className="flex items-center px-6 py-3 font-semibold text-nordic-midnight transition-all duration-200 rounded-lg shadow-lg bg-nordic-sunrise/20 hover:bg-nordic-sunrise/30 hover:shadow-xl hover:scale-105"
              aria-label={t("aria.browseCuratedSets")}
            >
              <HeroSparklesIcon className="w-5 h-5 mr-2 text-nordic-sunrise" />
              {t("wordsets.curated.browse")}
            </Link>
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
            onStartTest={(wordSet) => {
              setSelectedWordSetForTest(wordSet);
              setModeSelectionOpen(true);
            }}
            onStartPractice={(wordSet) => {
              router.push(`/wordsets?view=practice&id=${wordSet.id}`);
            }}
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

        {/* Mode Selection Modal */}
        {modeSelectionOpen && selectedWordSetForTest && (
          <ModeSelectionModal
            wordSet={selectedWordSetForTest}
            isOpen={modeSelectionOpen}
            onSelectMode={(mode: TestMode) => {
              const url = `/wordsets?view=test&id=${selectedWordSetForTest.id}&mode=${mode}`;
              router.push(url);
              setModeSelectionOpen(false);
              setSelectedWordSetForTest(null);
            }}
            onClose={() => {
              setModeSelectionOpen(false);
              setSelectedWordSetForTest(null);
            }}
            userBirthYear={userData?.birthYear}
          />
        )}

        {/* Stavle Companion - context-aware encouragement */}
        <StavleCompanion
          wordSets={wordSets}
          userResults={userResults}
          familyProgress={familyProgress}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function WordSetsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-nordic-birch">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-b-2 border-nordic-sky rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <WordSetsPageContent />
    </Suspense>
  );
}
