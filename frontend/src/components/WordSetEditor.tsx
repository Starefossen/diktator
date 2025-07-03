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
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "@/components/modals/BaseModal";

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
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title={mode === "create" ? t("wordsets.create") : t("wordsets.edit")}
      size="xl"
    >
      <ModalContent>
        <form id="wordset-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                {t("wordsets.name")}
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder={t("wordsets.name.placeholder")}
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                {t("wordsets.language")}
              </label>
              <div className="mt-2">
                <select
                  id="language"
                  value={selectedLanguage}
                  onChange={(e) =>
                    setSelectedLanguage(e.target.value as Language)
                  }
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option value="en">{t("common.english")}</option>
                  <option value="no">{t("common.norwegian")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Words Section */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {t("wordsets.words")} ({words.length})
              </h3>
              <button
                type="button"
                onClick={showAddWordForm}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <HeroPlusIcon className="h-4 w-4 mr-1" />
                {t("wordsets.add")}
              </button>
            </div>

            {/* Add Word Form */}
            {showAddForm && (
              <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="grid grid-cols-1 gap-3 mb-3 md:grid-cols-2">
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
            <div className="mt-6 space-y-2 overflow-y-auto max-h-96">
              {words.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>{t("wordsets.noTitle")}</p>
                  <p className="mt-1 text-sm">{t("wordsets.noSubtitle")}</p>
                </div>
              ) : (
                words.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    {word.isEditing ? (
                      // Editing mode
                      <>
                        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
                          <input
                            ref={(el) => {
                              editRefs.current[`word-${word.id}`] = el;
                            }}
                            type="text"
                            value={word.word}
                            onChange={(e) =>
                              handleWordChange(word.id, "word", e.target.value)
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
                            className="p-1 text-green-600 rounded hover:text-green-800 hover:bg-green-100"
                            title="Save"
                          >
                            <HeroCheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelEdit(word.id)}
                            className="p-1 text-gray-600 rounded hover:text-gray-800 hover:bg-gray-100"
                            title="Cancel"
                          >
                            <HeroXMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      // Display mode
                      <>
                        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
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
                            className="p-1 text-blue-600 rounded hover:text-blue-800 hover:bg-blue-100"
                            title="Edit"
                          >
                            <HeroPencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWord(word.id)}
                            className="p-1 text-red-600 rounded hover:text-red-800 hover:bg-red-100"
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
        </form>
      </ModalContent>

      <ModalActions>
        {/* Primary action first in DOM for proper tab order and focus management */}
        <ModalButton
          onClick={() => {
            // Trigger form submission
            const form = document.getElementById(
              "wordset-form",
            ) as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          variant="primary"
          disabled={isLoading || !name.trim() || words.length === 0}
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
        </ModalButton>
        <ModalButton
          onClick={onCancel}
          variant="secondary"
          className="mt-3 sm:mt-0 sm:mr-3"
        >
          {t("wordsets.cancel")}
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
