"use client";

import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  WordSet,
  Language,
  TestConfiguration,
  DEFAULT_TEST_CONFIG,
} from "@/types";
import {
  ModelsUpdateWordSetRequest,
  ModelsCreateWordSetRequest,
  ModelsWordInput,
} from "@/generated";
import {
  HeroTrashIcon,
  HeroPlusIcon,
  HeroXMarkIcon,
  HeroPencilIcon,
  HeroCheckIcon,
} from "@/components/Icons";

interface WordSetEditorProps {
  mode: "create" | "edit";
  initialData?: WordSet;
  onSave: (
    data: ModelsCreateWordSetRequest | ModelsUpdateWordSetRequest,
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

interface EditableWord {
  id: string;
  word: string;
  definition: string;
  isEditing: boolean;
}

export default function WordSetEditor({
  mode,
  initialData,
  onSave,
  onCancel,
  isLoading = false,
  error = "",
}: WordSetEditorProps) {
  const { t, language } = useLanguage();

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (initialData?.language as Language) || (language as Language),
  );
  const [testConfiguration] = useState<TestConfiguration>(
    initialData?.testConfiguration || DEFAULT_TEST_CONFIG,
  );

  // Words state with inline editing
  const [words, setWords] = useState<EditableWord[]>(() => {
    if (initialData?.words) {
      return initialData.words.map((w, index) => ({
        id: `${w.word}-${index}`,
        word: w.word,
        definition: w.definition || "",
        isEditing: false,
      }));
    }
    return [];
  });

  // New word form state
  const [newWord, setNewWord] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Refs for focus management
  const newWordRef = useRef<HTMLInputElement>(null);
  const editRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleAddWord = () => {
    if (!newWord.trim()) return;

    const wordExists = words.some(
      (w) => w.word.toLowerCase() === newWord.trim().toLowerCase(),
    );
    if (wordExists) {
      // TODO: Show error message
      return;
    }

    const newWordItem: EditableWord = {
      id: `${newWord.trim()}-${Date.now()}`,
      word: newWord.trim(),
      definition: newDefinition.trim(),
      isEditing: false,
    };

    setWords([...words, newWordItem]);
    setNewWord("");
    setNewDefinition("");
    setShowAddForm(false);
  };

  const handleEditWord = (id: string) => {
    setWords(
      words.map((w) =>
        w.id === id ? { ...w, isEditing: true } : { ...w, isEditing: false },
      ),
    );

    // Focus the word input after state update
    setTimeout(() => {
      const input = editRefs.current[`word-${id}`];
      if (input) input.focus();
    }, 50);
  };

  const handleSaveEdit = (id: string) => {
    setWords(words.map((w) => (w.id === id ? { ...w, isEditing: false } : w)));
  };

  const handleCancelEdit = (id: string) => {
    // Reset to original values - would need to store original values
    setWords(words.map((w) => (w.id === id ? { ...w, isEditing: false } : w)));
  };

  const handleWordChange = (
    id: string,
    field: "word" | "definition",
    value: string,
  ) => {
    setWords(words.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  };

  const handleRemoveWord = (id: string) => {
    setWords(words.filter((w) => w.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || words.length === 0) {
      return;
    }

    const wordInputs: ModelsWordInput[] = words.map((w) => ({
      word: w.word,
      definition: w.definition || undefined,
    }));

    const formData = {
      name: name.trim(),
      words: wordInputs,
      language: selectedLanguage,
      testConfiguration,
    };

    await onSave(formData);
  };

  const showAddWordForm = () => {
    setShowAddForm(true);
    setTimeout(() => {
      if (newWordRef.current) {
        newWordRef.current.focus();
      }
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === "create" ? t("wordsets.create") : t("wordsets.edit")}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <HeroXMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Display */}
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("wordsets.name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("wordsets.name.placeholder")}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("wordsets.language")}
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) =>
                    setSelectedLanguage(e.target.value as Language)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">{t("common.english")}</option>
                  <option value="no">{t("common.norwegian")}</option>
                </select>
              </div>
            </div>

            {/* Words Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  {t("wordsets.words")} ({words.length})
                </h3>
                <button
                  type="button"
                  onClick={showAddWordForm}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  <HeroPlusIcon className="w-4 h-4 mr-1" />
                  {t("wordsets.add")}
                </button>
              </div>

              {/* Add Word Form */}
              {showAddForm && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <input
                        ref={newWordRef}
                        type="text"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("wordsets.addWord.placeholder")}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddWord();
                          }
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newDefinition}
                        onChange={(e) => setNewDefinition(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Definition/context (optional) - helps distinguish homophones like 'to', 'two', 'too'"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddWord();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddWord}
                      disabled={!newWord.trim()}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("wordsets.add")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewWord("");
                        setNewDefinition("");
                      }}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      {t("wordsets.cancel")}
                    </button>
                  </div>
                </div>
              )}

              {/* Words List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {words.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t("wordsets.noTitle")}</p>
                    <p className="text-sm mt-1">{t("wordsets.noSubtitle")}</p>
                  </div>
                ) : (
                  words.map((word) => (
                    <div
                      key={word.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      {word.isEditing ? (
                        // Editing mode
                        <>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              ref={(el) => {
                                editRefs.current[`word-${word.id}`] = el;
                              }}
                              type="text"
                              value={word.word}
                              onChange={(e) =>
                                handleWordChange(
                                  word.id,
                                  "word",
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveEdit(word.id);
                                }
                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleCancelEdit(word.id);
                                }
                              }}
                            />
                            <input
                              type="text"
                              value={word.definition}
                              onChange={(e) =>
                                handleWordChange(
                                  word.id,
                                  "definition",
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Definition/context (optional)"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveEdit(word.id);
                                }
                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleCancelEdit(word.id);
                                }
                              }}
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(word.id)}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                              title="Save"
                            >
                              <HeroCheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelEdit(word.id)}
                              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                              title="Cancel"
                            >
                              <HeroXMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        // Display mode
                        <>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="font-medium text-gray-900">
                              {word.word}
                            </div>
                            <div className="text-sm text-gray-600">
                              {word.definition || (
                                <span className="italic text-gray-400">
                                  No definition
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditWord(word.id)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                              title="Edit"
                            >
                              <HeroPencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveWord(word.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                              title="Remove"
                            >
                              <HeroTrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500"
              >
                {t("wordsets.cancel")}
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim() || words.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                    {mode === "create"
                      ? t("wordsets.creating")
                      : t("wordsets.updating")}
                  </div>
                ) : mode === "create" ? (
                  t("wordsets.create")
                ) : (
                  t("wordsets.save")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
