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
    if (!formData.name.trim() || formData.words.length === 0) {
      alert(t("wordsets.nameRequired"));
      return;
    }

    try {
      setCreating(true);
      const response = await generatedApiClient.createWordSet(formData);
      if (response.data?.data) {
        setWordSets([response.data.data as WordSet, ...wordSets]);
        setFormData({ name: "", words: [], language: language as Language });
        setShowCreateForm(false);
        alert(t("wordsets.createSuccess"));
      }
    } catch (error) {
      console.error("Failed to create word set:", error);
      alert(t("wordsets.createError"));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWordSet = async (id: string) => {
    if (!confirm(t("wordsets.deleteConfirm"))) {
      return;
    }

    try {
      await generatedApiClient.deleteWordSet(id);
      setWordSets(wordSets.filter((ws) => ws.id !== id));
      alert(t("wordsets.deleteSuccess"));
    } catch (error) {
      console.error("Failed to delete word set:", error);
      alert(t("wordsets.deleteError"));
    }
  };

  const handleGenerateAudio = async (wordSetId: string) => {
    try {
      await generatedApiClient.generateAudio(wordSetId);
      alert(t("wordsets.audioGeneration"));
    } catch (error) {
      console.error("Failed to generate audio:", error);
      alert(t("wordsets.audioError"));
    }
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
    router.push(`/test?id=${wordSetId}`);
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
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl hover:scale-105"
            >
              <span className="text-lg mr-2">{showCreateForm ? "✕" : "+"}</span>
              {showCreateForm ? t("wordsets.cancel") : t("wordsets.create")}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="p-6 mb-8 bg-white border border-gray-100 rounded-lg shadow-lg">
              <h2 className="mb-4 text-2xl font-semibold text-gray-800">
                {t("wordsets.create")}
              </h2>

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
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4 overflow-y-auto max-h-20">
                    {wordSet.words.slice(0, 10).map((word, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-sm text-gray-700 bg-gray-100 rounded"
                      >
                        {word}
                      </span>
                    ))}
                    {wordSet.words.length > 10 && (
                      <span className="px-2 py-1 text-sm text-gray-600 bg-gray-200 rounded">
                        +{wordSet.words.length - 10} {t("wordsets.moreWords")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startTest(wordSet.id)}
                      className="flex items-center justify-center flex-1 px-4 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-lg hover:scale-105"
                    >
                      <HeroPlayIcon className="w-4 h-4 mr-2 text-white" />
                      {t("wordsets.startTest")}
                    </button>
                    <button
                      onClick={() => handleGenerateAudio(wordSet.id)}
                      className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-purple-500 rounded-lg shadow-md hover:bg-purple-600 hover:shadow-lg hover:scale-105"
                      title={t("wordsets.generateAudio")}
                    >
                      <HeroVolumeIcon className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => openSettingsModal(wordSet)}
                      className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 hover:shadow-lg hover:scale-105"
                      title={t("wordsets.settings")}
                    >
                      <HeroSettingsIcon className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDeleteWordSet(wordSet.id)}
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
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
      </div>
    </ProtectedRoute>
  );
}
