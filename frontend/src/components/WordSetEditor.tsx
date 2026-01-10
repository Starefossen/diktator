"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/locales";
import {
  WordSet,
  TestConfiguration,
  DEFAULT_TEST_CONFIG,
  Translation,
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
import { ChildAssignmentSelector } from "@/components/ChildAssignmentSelector";
import { useAuth } from "@/contexts/AuthContext";

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
  translations: Translation[];
  isEditing: boolean;
  showTranslations?: boolean;
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
  const { userData } = useAuth();

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (initialData?.language as Language) || (language as Language),
  );
  const [defaultMode, setDefaultMode] = useState<
    "standard" | "dictation" | "translation"
  >(initialData?.testConfiguration?.defaultMode || "standard");
  const [targetLanguage, setTargetLanguage] = useState<Language>(
    (initialData?.testConfiguration?.targetLanguage as Language) || "en",
  );
  const [testConfiguration, _setTestConfiguration] =
    useState<TestConfiguration>(
      initialData?.testConfiguration || DEFAULT_TEST_CONFIG,
    );

  // Words state with inline editing
  const [words, setWords] = useState<EditableWord[]>(() => {
    if (initialData?.words) {
      return initialData.words.map((w, index) => ({
        id: `${w.word}-${index}`,
        word: w.word,
        definition: w.definition || "",
        translations: w.translations || [],
        isEditing: false,
        showTranslations: false,
      }));
    }
    return [];
  });

  // New word form state
  const [newWord, setNewWord] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [_newTranslationLang, _setNewTranslationLang] =
    useState<Language>("en");
  const [newTranslationText, setNewTranslationText] = useState("");

  // Child assignment state
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(
    initialData?.assignedUserIds || [],
  );

  // Refs for focus management
  const newWordRef = useRef<HTMLInputElement>(null);
  const editRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the name input when creating a new wordset, word input when editing
  useEffect(() => {
    if (mode === "create" && nameInputRef.current) {
      nameInputRef.current.focus();
    } else if (mode === "edit" && newWordRef.current) {
      newWordRef.current.focus();
    }
  }, [mode]);

  const handleAddWord = () => {
    if (!newWord.trim()) return;

    // Validate translation mode requirements
    if (defaultMode === "translation" && !newTranslationText.trim()) {
      return;
    }

    const wordExists = words.some(
      (w) => w.word.toLowerCase() === newWord.trim().toLowerCase(),
    );
    if (wordExists) {
      // TODO: Show error message
      return;
    }

    const translations: Translation[] = [];
    if (defaultMode === "translation" && newTranslationText.trim()) {
      translations.push({
        language: targetLanguage,
        text: newTranslationText.trim(),
      });
    }

    const newWordItem: EditableWord = {
      id: `${newWord.trim()}-${Date.now()}`,
      word: newWord.trim(),
      definition: newDefinition.trim(),
      translations,
      isEditing: false,
      showTranslations: false,
    };

    setWords([...words, newWordItem]);
    setNewWord("");
    setNewDefinition("");
    setNewTranslationText("");
    // Focus back to the word input for easy continuation
    if (newWordRef.current) {
      newWordRef.current.focus();
    }
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
      translations: w.translations.length > 0 ? w.translations : undefined,
    }));

    const updatedTestConfig: TestConfiguration = {
      ...testConfiguration,
      defaultMode,
      targetLanguage:
        defaultMode === "translation" ? targetLanguage : undefined,
    };

    const formData = {
      name: name.trim(),
      words: wordInputs,
      language: selectedLanguage,
      testConfiguration: updatedTestConfig,
    };

    await onSave(formData);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title={mode === "create" ? t("wordsets.create") : t("wordsets.edit")}
      size="xl"
    >
      <div className="flex flex-col h-full max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-160px)] md:max-h-[calc(100vh-140px)] lg:max-h-[calc(100vh-160px)]">
        <ModalContent className="flex-1 min-h-0 pb-4 overflow-y-auto">
          <form id="wordset-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-md bg-red-50">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="name"
                  className="block font-medium text-gray-900 text-sm/6"
                >
                  {t("wordsets.name")}
                </label>
                <div className="mt-2">
                  <input
                    ref={nameInputRef}
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                    placeholder={t("wordsets.name.placeholder")}
                    required
                  />
                </div>
              </div>
              <div className="sm:col-span-3">
                <label
                  htmlFor="language"
                  className="block font-medium text-gray-900 text-sm/6"
                >
                  {t("wordsets.language")}
                </label>
                <div className="grid grid-cols-1 mt-2">
                  <select
                    id="language"
                    value={selectedLanguage}
                    onChange={(e) =>
                      setSelectedLanguage(e.target.value as Language)
                    }
                    className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                  >
                    <option value="en">{t("common.english")}</option>
                    <option value="no">{t("common.norwegian")}</option>
                  </select>
                  <svg
                    className="self-center col-start-1 row-start-1 mr-2 text-gray-500 pointer-events-none size-5 justify-self-end sm:size-4"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Default Mode Selection */}
            <div>
              <div className="block mb-3 font-medium text-gray-900 text-sm/6">
                {t("wordsets.editor.defaultTestMode")}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label
                  htmlFor="mode-standard"
                  className="relative flex p-4 bg-white border rounded-lg shadow-sm cursor-pointer focus:outline-none"
                >
                  <input
                    id="mode-standard"
                    type="radio"
                    name="default-mode"
                    value="standard"
                    checked={defaultMode === "standard"}
                    onChange={(e) =>
                      setDefaultMode(
                        e.target.value as
                          | "standard"
                          | "dictation"
                          | "translation",
                      )
                    }
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">
                        Standard
                      </span>
                      <span className="flex items-center mt-1 text-sm text-gray-500">
                        {t("wordsets.editor.mode.standard.description")}
                      </span>
                    </span>
                  </span>
                  <svg
                    className={`h-5 w-5 ${defaultMode === "standard" ? "text-nordic-teal" : "text-transparent"}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </label>

                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label
                  htmlFor="mode-dictation"
                  className="relative flex p-4 bg-white border rounded-lg shadow-sm cursor-pointer focus:outline-none"
                >
                  <input
                    id="mode-dictation"
                    type="radio"
                    name="default-mode"
                    value="dictation"
                    checked={defaultMode === "dictation"}
                    onChange={(e) =>
                      setDefaultMode(
                        e.target.value as
                          | "standard"
                          | "dictation"
                          | "translation",
                      )
                    }
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">
                        Dictation
                      </span>
                      <span className="flex items-center mt-1 text-sm text-gray-500">
                        {t("wordsets.editor.mode.dictation.description")}
                      </span>
                    </span>
                  </span>
                  <svg
                    className={`h-5 w-5 ${defaultMode === "dictation" ? "text-nordic-teal" : "text-transparent"}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </label>

                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label
                  htmlFor="mode-translation"
                  className="relative flex p-4 bg-white border rounded-lg shadow-sm cursor-pointer focus:outline-none"
                >
                  <input
                    id="mode-translation"
                    type="radio"
                    name="default-mode"
                    value="translation"
                    checked={defaultMode === "translation"}
                    onChange={(e) =>
                      setDefaultMode(
                        e.target.value as
                          | "standard"
                          | "dictation"
                          | "translation",
                      )
                    }
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">
                        Translation
                      </span>
                      <span className="flex items-center mt-1 text-sm text-gray-500">
                        {t("wordsets.editor.mode.translation.description")}
                      </span>
                    </span>
                  </span>
                  <svg
                    className={`h-5 w-5 ${defaultMode === "translation" ? "text-nordic-teal" : "text-transparent"}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </label>
              </div>

              {/* Target Language for Translation Mode */}
              {defaultMode === "translation" && (
                <div className="mt-4">
                  <label
                    htmlFor="target-language"
                    className="block font-medium text-gray-900 text-sm/6"
                  >
                    {t("wordsets.editor.targetLanguage")}
                  </label>
                  <div className="grid grid-cols-1 mt-2">
                    <select
                      id="target-language"
                      value={targetLanguage}
                      onChange={(e) =>
                        setTargetLanguage(e.target.value as Language)
                      }
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                    >
                      <option value="en">{t("common.english")}</option>
                      <option value="no">{t("common.norwegian")}</option>
                    </select>
                    <svg
                      className="self-center col-start-1 row-start-1 mr-2 text-gray-500 pointer-events-none size-5 justify-self-end sm:size-4"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Users will translate from{" "}
                    {selectedLanguage === "en" ? "English" : "Norwegian"} to{" "}
                    {targetLanguage === "en" ? "English" : "Norwegian"}
                  </p>
                </div>
              )}
            </div>

            {/* Words Section */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-base/7">
                  {t("wordsets.words")} ({words.length})
                </h3>
              </div>

              {/* Add Word Form - Always visible */}
              <div className="p-4 mt-6 border border-nordic-sky/30 rounded-lg bg-nordic-sky/10">
                <div className="grid grid-cols-1 gap-3 mb-3 md:grid-cols-2">
                  <div>
                    <input
                      ref={newWordRef}
                      type="text"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                      placeholder={
                        defaultMode === "translation"
                          ? `Source word (${selectedLanguage})`
                          : t("wordsets.addWord.placeholder")
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (defaultMode === "translation") {
                            // Don't submit if translation is required but empty
                            return;
                          }
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
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                      placeholder={t("wordsets.editor.definition.placeholder")}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            defaultMode === "translation" &&
                            !newTranslationText.trim()
                          ) {
                            // Don't submit if translation is required but empty
                            return;
                          }
                          handleAddWord();
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Translation input for translation mode */}
                {defaultMode === "translation" && (
                  <div className="mb-3">
                    <input
                      type="text"
                      value={newTranslationText}
                      onChange={(e) => setNewTranslationText(e.target.value)}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                      placeholder={`Translation (${targetLanguage}) - required for translation mode`}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddWord();
                        }
                      }}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddWord}
                    disabled={
                      !newWord.trim() ||
                      (defaultMode === "translation" &&
                        !newTranslationText.trim())
                    }
                    className="rounded-md bg-nordic-teal px-2.5 py-1.5 text-sm font-semibold text-nordic-midnight shadow-xs ring-1 ring-nordic-teal ring-inset hover:bg-nordic-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nordic-teal disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HeroPlusIcon className="inline w-4 h-4 mr-1" />
                    {t("wordsets.add")}
                  </button>
                </div>
              </div>

              {/* Words List */}
              <div className="mt-6 space-y-2">
                {words.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <p>{t("wordsets.editor.noWords")}</p>
                    <p className="mt-1 text-sm">
                      {t("wordsets.editor.noWordsHint")}
                    </p>
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
                                handleWordChange(
                                  word.id,
                                  "word",
                                  e.target.value,
                                )
                              }
                              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
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
                              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                              placeholder={t(
                                "wordsets.editor.definition.placeholderShort",
                              )}
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
                              className="p-1 text-nordic-sky rounded hover:text-nordic-sky/80 hover:bg-nordic-sky/10"
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

            {/* Child Assignment Section (parent only, edit mode only) */}
            {userData?.role === "parent" &&
              mode === "edit" &&
              initialData?.id && (
                <div className="pt-6 mt-6 border-t border-gray-200">
                  <ChildAssignmentSelector
                    wordSetId={initialData.id}
                    assignedUserIds={assignedUserIds}
                    onAssignmentChange={setAssignedUserIds}
                  />
                </div>
              )}
          </form>
        </ModalContent>

        <ModalActions className="mt-6 shrink-0 sm:mt-6 md:mt-8">
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
      </div>
    </BaseModal>
  );
}
