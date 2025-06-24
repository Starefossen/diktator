"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  WordSet,
  CreateWordSetRequest,
  Language,
  TestConfiguration,
  DEFAULT_TEST_CONFIG,
  validateTestConfiguration,
} from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import { playWordAudio, getWordSetAudioStats } from "@/lib/audioPlayer";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  HeroBookIcon,
  HeroVolumeIcon,
  HeroPlayIcon,
  HeroTrashIcon,
  HeroSaveIcon,
  HeroSettingsIcon,
} from "@/components/Icons";

export default function WordSetsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsWordSet, setSettingsWordSet] = useState<WordSet | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteWordSet, setDeleteWordSet] = useState<WordSet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState<Set<string>>(new Set()); // Track which wordsets are generating audio
  const [playingAudio, setPlayingAudio] = useState<string | null>(null); // Track which word is currently playing
  const [audioGenerationStatus, setAudioGenerationStatus] = useState<{ [key: string]: string }>({}); // Track status messages

  // Create form state
  const [formData, setFormData] = useState<CreateWordSetRequest>({
    name: "",
    words: [],
    language: language as Language,
    testConfiguration: DEFAULT_TEST_CONFIG,
  });
  const [newWord, setNewWord] = useState("");

  // Settings form state
  const [settingsConfig, setSettingsConfig] =
    useState<TestConfiguration>(DEFAULT_TEST_CONFIG);
  const [formError, setFormError] = useState<string>("");

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

  useEffect(() => {
    loadWordSets();
  }, [loadWordSets]);

  const handleCreateWordSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || formData.words.length === 0) {
      setFormError(t("wordsets.nameRequired"));
      return;
    }

    try {
      setCreating(true);
      const response = await generatedApiClient.createWordSet(formData);
      if (response.data?.data) {
        setWordSets([response.data.data as WordSet, ...wordSets]);
        setFormData({ name: "", words: [], language: language as Language, testConfiguration: DEFAULT_TEST_CONFIG });
        setFormError("");
        setShowCreateForm(false);
        // Success feedback - could add a toast notification here instead of alert
        console.log("Word set created successfully");
      }
    } catch (error) {
      console.error("Failed to create word set:", error);
      setFormError(t("wordsets.createError"));
    } finally {
      setCreating(false);
    }
  };

  const openDeleteModal = (wordSet: WordSet) => {
    setDeleteWordSet(wordSet);
    setShowDeleteModal(true);
  };

  const handleDeleteWordSet = async () => {
    if (!deleteWordSet) return;

    try {
      setDeleting(true);
      await generatedApiClient.deleteWordSet(deleteWordSet.id);
      setWordSets(wordSets.filter((ws) => ws.id !== deleteWordSet.id));
      setShowDeleteModal(false);
      setDeleteWordSet(null);
      console.log("Word set deleted successfully");
    } catch (error) {
      console.error("Failed to delete word set:", error);
      // Could show error message in the modal
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateAudio = async (wordSetId: string) => {
    try {
      setGeneratingAudio(prev => new Set([...prev, wordSetId]));
      setAudioGenerationStatus(prev => ({ ...prev, [wordSetId]: "Starting audio generation..." }));

      await generatedApiClient.generateAudio(wordSetId);

      setAudioGenerationStatus(prev => ({ ...prev, [wordSetId]: "Checking audio files..." }));

      // Instead of refreshing all wordsets, fetch just the updated one
      const response = await generatedApiClient.getWordSets();
      if (response.data?.data) {
        const updatedWordSets = response.data.data as WordSet[];
        const updatedWordSet = updatedWordSets.find(ws => ws.id === wordSetId);

        if (updatedWordSet) {
          // Check if audio was actually generated
          const audioStats = getWordSetAudioStats(updatedWordSet);

          if (audioStats.hasAnyAudio) {
            setAudioGenerationStatus(prev => ({
              ...prev,
              [wordSetId]: `Audio generated for ${audioStats.wordsWithAudio}/${audioStats.totalWords} words!`
            }));

            // Update only the specific wordset in the list
            setWordSets(prevWordSets =>
              prevWordSets.map(ws => ws.id === wordSetId ? updatedWordSet : ws)
            );
          } else {
            setAudioGenerationStatus(prev => ({
              ...prev,
              [wordSetId]: "Audio generation completed, but no audio files were created."
            }));
          }
        }
      }

      // Clear status message after 3 seconds
      setTimeout(() => {
        setAudioGenerationStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[wordSetId];
          return newStatus;
        });
      }, 3000);

    } catch (error) {
      console.error("Failed to generate audio:", error);
      setAudioGenerationStatus(prev => ({
        ...prev,
        [wordSetId]: "Failed to generate audio. Please try again."
      }));

      // Clear error message after 5 seconds
      setTimeout(() => {
        setAudioGenerationStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[wordSetId];
          return newStatus;
        });
      }, 5000);
    } finally {
      setGeneratingAudio(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordSetId);
        return newSet;
      });
    }
  };

  const handleWordClick = async (word: string, wordSet: WordSet) => {
    // Only play if audio is available
    const wordItem = wordSet.words.find(w => w.word === word);
    if (!wordItem?.audio?.audioId) {
      return; // No audio available
    }

    setPlayingAudio(word);

    await playWordAudio(word, wordSet, {
      onEnd: () => {
        setPlayingAudio(null);
      },
      onError: (error) => {
        setPlayingAudio(null);
        console.error("Failed to play audio for word:", word, error);
      }
    });
  };

  const openSettingsModal = (wordSet: WordSet) => {
    setSettingsWordSet(wordSet);
    setSettingsConfig(wordSet.testConfiguration || DEFAULT_TEST_CONFIG);
    setShowSettingsModal(true);
  };

  const saveSettings = async () => {
    if (!settingsWordSet) return;

    try {
      const validatedConfig = validateTestConfiguration(settingsConfig);
      // TODO: Implement API call to update wordset configuration
      console.log(
        "Saving settings for wordset:",
        settingsWordSet.id,
        validatedConfig,
      );

      // Update local state
      setWordSets(
        wordSets.map((ws) =>
          ws.id === settingsWordSet.id
            ? { ...ws, testConfiguration: validatedConfig }
            : ws,
        ),
      );

      setShowSettingsModal(false);
      setSettingsWordSet(null);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const addWord = () => {
    if (newWord.trim() && !formData.words.includes(newWord.trim())) {
      setFormData({
        ...formData,
        words: [...formData.words, newWord.trim()],
      });
      setNewWord("");
    }
  };

  const removeWord = (index: number) => {
    setFormData({
      ...formData,
      words: formData.words.filter((_, i) => i !== index),
    });
  };

  const startTest = (wordSetId: string) => {
    router.push(`/test#${wordSetId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{t("wordsets.loading")}</p>
        </div>
      </div>
    );
  }

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
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setFormError("");
              }}
              className="flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl hover:scale-105"
            >
              <span className="mr-2 text-lg">{showCreateForm ? "✕" : "+"}</span>
              {showCreateForm ? t("wordsets.cancel") : t("wordsets.create")}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="p-6 mb-8 bg-white border border-gray-100 rounded-lg shadow-lg">
              <h2 className="mb-4 text-2xl font-semibold text-gray-800">
                {t("wordsets.create")}
              </h2>

              {formError && (
                <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-300 rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateWordSet} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("wordsets.name")}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("wordsets.name.placeholder")}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("wordsets.language")}
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        language: e.target.value as Language,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="no">Norwegian</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("wordsets.words")}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addWord())
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t("wordsets.addWord.placeholder")}
                    />
                    <button
                      type="button"
                      onClick={addWord}
                      className="px-5 py-2 font-medium text-white transition-all duration-200 bg-blue-500 rounded-lg hover:bg-blue-600 hover:shadow-md"
                    >
                      {t("wordsets.add")}
                    </button>
                  </div>

                  {formData.words.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.words.map((word, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full"
                        >
                          {word}
                          <button
                            type="button"
                            onClick={() => removeWord(index)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 bg-green-600 rounded-lg hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        {t("wordsets.creating")}
                      </>
                    ) : (
                      <>
                        <HeroSaveIcon className="w-4 h-4 mr-2 text-white" />
                        {t("wordsets.save")}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex items-center px-6 py-3 font-semibold text-gray-700 transition-all duration-200 bg-gray-200 rounded-lg hover:bg-gray-300 hover:shadow-md"
                  >
                    <span className="mr-2">✕</span>
                    {t("wordsets.cancel")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Word Sets List */}
          {wordSets.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4">
                <HeroBookIcon className="w-16 h-16 mx-auto text-indigo-500" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-600">
                {t("wordsets.noTitle")}
              </h3>
              <p className="text-gray-500">{t("wordsets.noSubtitle")}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {wordSets.map((wordSet) => (
                <div
                  key={wordSet.id}
                  className="p-6 transition-shadow duration-200 bg-white border border-gray-100 rounded-lg shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {wordSet.name}
                    </h3>
                    <span className="px-2 py-1 text-sm text-blue-800 uppercase bg-blue-100 rounded">
                      {wordSet.language}
                    </span>
                  </div>

                  <p className="mb-4 text-gray-600">
                    {wordSet.words.length}{" "}
                    {wordSet.words.length === 1
                      ? t("results.word")
                      : t("wordsets.words.count")}
                    {(() => {
                      const audioStats = getWordSetAudioStats(wordSet);
                      return audioStats.hasAnyAudio && (
                        <span className="ml-2 text-sm text-blue-600">
                          • {audioStats.wordsWithAudio} with audio
                        </span>
                      );
                    })()}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4 overflow-y-auto max-h-20">
                    {wordSet.words.slice(0, 10).map((wordItem, index) => {
                      const hasAudio = wordItem.audio?.audioUrl;
                      const isPlaying = playingAudio === wordItem.word;

                      return (
                        <span
                          key={index}
                          onClick={() => hasAudio ? handleWordClick(wordItem.word, wordSet) : undefined}
                          className={`inline-flex items-center px-2 py-1 text-sm rounded transition-all duration-200 ${hasAudio
                            ? 'text-blue-700 bg-blue-100 cursor-pointer hover:bg-blue-200 hover:shadow-sm'
                            : 'text-gray-700 bg-gray-100'
                            } ${isPlaying ? 'ring-2 ring-blue-500 shadow-md' : ''}`}
                          title={hasAudio ? t("wordsets.clickToPlay") : t("wordsets.noAudio")}
                        >
                          {hasAudio && (
                            <HeroVolumeIcon className={`w-3 h-3 mr-1 ${isPlaying ? 'text-blue-600' : 'text-blue-500'}`} />
                          )}
                          {wordItem.word}
                        </span>
                      );
                    })}
                    {wordSet.words.length > 10 && (
                      <span className="px-2 py-1 text-sm text-gray-600 bg-gray-200 rounded">
                        +{wordSet.words.length - 10} {t("wordsets.moreWords")}
                      </span>
                    )}
                  </div>

                  {/* Progress indicator during audio generation */}
                  {generatingAudio.has(wordSet.id) && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          {audioGenerationStatus[wordSet.id] || "Generating audio..."}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-purple-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  )}

                  {/* Status message for audio generation */}
                  {audioGenerationStatus[wordSet.id] && (
                    <div className={`p-2 mb-3 text-sm rounded-lg ${audioGenerationStatus[wordSet.id].includes('generated')
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : audioGenerationStatus[wordSet.id].includes('Failed')
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                      {audioGenerationStatus[wordSet.id]}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startTest(wordSet.id)}
                      className="flex items-center justify-center flex-1 px-4 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-lg hover:scale-105"
                    >
                      <HeroPlayIcon className="w-4 h-4 mr-2 text-white" />
                      {t("wordsets.startTest")}
                    </button>
                    {(() => {
                      const audioStats = getWordSetAudioStats(wordSet);
                      const isGenerating = generatingAudio.has(wordSet.id);
                      const statusMessage = audioGenerationStatus[wordSet.id];
                      const hasCompleteAudio = audioStats.hasAllAudio;
                      const hasGeneratedStatus = statusMessage?.includes('generated');
                      const hasFailedStatus = statusMessage?.includes('Failed');

                      return (
                        <button
                          onClick={() => handleGenerateAudio(wordSet.id)}
                          disabled={
                            isGenerating ||
                            hasGeneratedStatus ||
                            hasCompleteAudio
                          }
                          className={`flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100 ${isGenerating
                            ? 'bg-purple-500 animate-pulse'
                            : hasGeneratedStatus || hasCompleteAudio
                              ? 'bg-green-500'
                              : hasFailedStatus
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-purple-500 hover:bg-purple-600'
                            }`}
                          title={
                            isGenerating
                              ? statusMessage || "Generating audio..."
                              : hasGeneratedStatus || hasCompleteAudio
                                ? "All audio has been generated"
                                : t("wordsets.generateAudio")
                          }
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                              <span className="text-xs">
                                {statusMessage?.includes('Starting') ? 'Starting...' :
                                  statusMessage?.includes('Checking') ? 'Checking...' : 'Generating...'}
                              </span>
                            </>
                          ) : statusMessage || hasCompleteAudio ? (
                            <span className="text-xs text-center">
                              {hasGeneratedStatus || hasCompleteAudio ? '✓' :
                                hasFailedStatus ? '✗' : '⚠'}
                            </span>
                          ) : (
                            <HeroVolumeIcon className="w-4 h-4 text-white" />
                          )}
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => openSettingsModal(wordSet)}
                      className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 hover:shadow-lg hover:scale-105"
                      title={t("wordsets.settings")}
                    >
                      <HeroSettingsIcon className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(wordSet)}
                      className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg hover:scale-105"
                      title={t("wordsets.delete")}
                    >
                      <HeroTrashIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Modal */}
        {showSettingsModal && settingsWordSet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                {t("wordsets.settings")} - {settingsWordSet.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("wordsets.config.maxAttempts")}
                  </label>
                  <select
                    value={settingsConfig.maxAttempts}
                    onChange={(e) =>
                      setSettingsConfig({
                        ...settingsConfig,
                        maxAttempts: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 {t("wordsets.config.attempt")}</option>
                    <option value={2}>2 {t("wordsets.config.attempts")}</option>
                    <option value={3}>
                      3 {t("wordsets.config.attempts")} (
                      {t("wordsets.config.default")})
                    </option>
                    <option value={4}>4 {t("wordsets.config.attempts")}</option>
                    <option value={5}>5 {t("wordsets.config.attempts")}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsConfig.autoPlayAudio}
                      onChange={(e) =>
                        setSettingsConfig({
                          ...settingsConfig,
                          autoPlayAudio: e.target.checked,
                        })
                      }
                      className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t("wordsets.config.autoPlayAudio")}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsConfig.shuffleWords}
                      onChange={(e) =>
                        setSettingsConfig({
                          ...settingsConfig,
                          shuffleWords: e.target.checked,
                        })
                      }
                      className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t("wordsets.config.shuffleWords")}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsConfig.showCorrectAnswer}
                      onChange={(e) =>
                        setSettingsConfig({
                          ...settingsConfig,
                          showCorrectAnswer: e.target.checked,
                        })
                      }
                      className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t("wordsets.config.showCorrectAnswer")}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsConfig.autoAdvance}
                      onChange={(e) =>
                        setSettingsConfig({
                          ...settingsConfig,
                          autoAdvance: e.target.checked,
                        })
                      }
                      className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t("wordsets.config.autoAdvance")}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("wordsets.config.timeLimit")} (
                    {t("wordsets.config.optional")})
                  </label>
                  <input
                    type="number"
                    value={settingsConfig.timeLimit || ""}
                    onChange={(e) =>
                      setSettingsConfig({
                        ...settingsConfig,
                        timeLimit: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder={t("wordsets.config.noTimeLimit")}
                    min="1"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t("wordsets.config.timeLimitHelp")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  {t("wordsets.cancel")}
                </button>
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {t("wordsets.saveSettings")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deleteWordSet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <HeroTrashIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {t("wordsets.deleteConfirm")}
                </h3>
                <p className="mb-4 text-sm text-gray-500">
                  Are you sure you want to delete &quot;{deleteWordSet.name}&quot;? This action cannot be undone.
                </p>

                <div className="p-3 mb-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        This will permanently delete the wordset and all its associated data including audio files.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteWordSet(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("wordsets.cancel")}
                </button>
                <button
                  onClick={handleDeleteWordSet}
                  disabled={deleting}
                  className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <HeroTrashIcon className="w-4 h-4 mr-2 text-white" />
                      {t("wordsets.delete")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
