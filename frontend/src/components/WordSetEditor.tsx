"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/locales";
import {
  WordSet,
  TestConfiguration,
  DEFAULT_TEST_CONFIG,
  Translation,
  TestMode,
  TEST_MODES,
} from "@/types";
import {
  ModelsUpdateWordSetRequest,
  ModelsCreateWordSetRequest,
  ModelsWordInput,
} from "@/generated";
import {
  HeroTrashIcon,
  HeroPlusIcon,
  HeroPencilIcon,
} from "@/components/Icons";
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "@/components/modals/BaseModal";
import { getMode } from "@/lib/testEngine/registry";
import { ChildAssignmentSelector } from "@/components/ChildAssignmentSelector";
import { useAuth } from "@/contexts/AuthContext";
import {
  isSentence,
  getWordCount,
  classifySentenceDifficulty,
} from "@/lib/sentenceConfig";
import { generatedApiClient } from "@/lib/api-generated";

interface WordSetEditorProps {
  mode: "create" | "edit";
  initialData?: WordSet;
  onSave: (
    data: ModelsCreateWordSetRequest | ModelsUpdateWordSetRequest,
    pendingAssignments?: string[],
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
  showTranslations?: boolean;
}

/**
 * Badge showing word count and difficulty for sentences
 */
function WordBadge({ text }: { text: string }) {
  const { t } = useLanguage();
  const isSentenceText = isSentence(text);

  if (!isSentenceText) {
    return null;
  }

  const wordCount = getWordCount(text);
  const difficulty = classifySentenceDifficulty(wordCount);

  // Should not happen since we already checked isSentence, but satisfy TypeScript
  if (!difficulty) {
    return null;
  }

  const difficultyColors = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-amber-100 text-amber-700",
    advanced: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center gap-1.5 ml-2">
      <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
        {wordCount} {t("wordsets.words.count")}
      </span>
      <span
        className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded ${difficultyColors[difficulty]}`}
      >
        {t(`sentence.difficulty.${difficulty}`)}
      </span>
    </div>
  );
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
  const [defaultMode, setDefaultMode] = useState<TestMode>(
    initialData?.testConfiguration?.defaultMode || "keyboard",
  );
  const [targetLanguage, setTargetLanguage] = useState<Language>(
    (initialData?.testConfiguration?.targetLanguage as Language) || "en",
  );
  const [testConfiguration, _setTestConfiguration] =
    useState<TestConfiguration>(
      initialData?.testConfiguration || DEFAULT_TEST_CONFIG,
    );

  // Words state
  const [words, setWords] = useState<EditableWord[]>(() => {
    if (initialData?.words) {
      return initialData.words.map((w, index) => ({
        id: `${w.word}-${index}`,
        word: w.word,
        definition: w.definition || "",
        translations: w.translations || [],
        showTranslations: false,
      }));
    }
    return [];
  });

  // New/editing word form state
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [_newTranslationLang, _setNewTranslationLang] =
    useState<Language>("en");
  const [newTranslationText, setNewTranslationText] = useState("");
  const [translationError, setTranslationError] = useState(false);

  // Child assignment state
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(
    initialData?.assignedUserIds || [],
  );

  // Refs for focus management
  const newWordRef = useRef<HTMLInputElement>(null);
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

    if (defaultMode === "translation" && !newTranslationText.trim()) {
      setTranslationError(true);
      return;
    }

    const wordExists = words.some(
      (w) =>
        w.id !== editingWordId &&
        w.word.toLowerCase() === newWord.trim().toLowerCase(),
    );
    if (wordExists) {
      return;
    }

    const translations: Translation[] = [];
    if (defaultMode === "translation" && newTranslationText.trim()) {
      translations.push({
        language: targetLanguage,
        text: newTranslationText.trim(),
      });
    }

    if (editingWordId) {
      setWords(
        words.map((w) =>
          w.id === editingWordId
            ? {
                ...w,
                word: newWord.trim(),
                definition: newDefinition.trim(),
                translations,
              }
            : w,
        ),
      );
      setEditingWordId(null);
    } else {
      const newWordItem: EditableWord = {
        id: `${newWord.trim()}-${Date.now()}`,
        word: newWord.trim(),
        definition: newDefinition.trim(),
        translations,
        showTranslations: false,
      };
      setWords([...words, newWordItem]);
    }

    setNewWord("");
    setNewDefinition("");
    setNewTranslationText("");
    setTranslationError(false);
    if (newWordRef.current) {
      newWordRef.current.focus();
    }
  };

  const handleEditWord = (id: string) => {
    const wordToEdit = words.find((w) => w.id === id);
    if (!wordToEdit) return;

    setEditingWordId(id);
    setNewWord(wordToEdit.word);
    setNewDefinition(wordToEdit.definition);

    if (defaultMode === "translation" && wordToEdit.translations.length > 0) {
      setNewTranslationText(wordToEdit.translations[0].text);
    } else {
      setNewTranslationText("");
    }

    if (newWordRef.current) {
      newWordRef.current.focus();
    }
  };

  const handleCancelEdit = () => {
    setEditingWordId(null);
    setNewWord("");
    setNewDefinition("");
    setNewTranslationText("");
  };

  const handleWordBlur = async () => {
    if (!newWord.trim() || selectedLanguage !== "no" || newDefinition.trim()) {
      return;
    }

    try {
      const response = await generatedApiClient.validateWord(
        newWord.trim(),
        "bm",
      );
      const data = response.data?.data as
        | {
            definition?: string;
            lemma?: string;
            wordClass?: string;
          }
        | null
        | undefined;

      if (data?.definition) {
        setNewDefinition(data.definition);
      }
    } catch (error) {
      console.error("Failed to validate word:", error);
    }
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

    const pendingAssignments =
      mode === "create" && assignedUserIds.length > 0
        ? assignedUserIds
        : undefined;

    await onSave(formData, pendingAssignments);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title={mode === "create" ? t("wordsets.create") : t("wordsets.edit")}
      size="xl"
    >
      <div className="flex flex-col h-full max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-160px)] md:max-h-[calc(100vh-140px)] lg:max-h-[calc(100vh-160px)]">
        <ModalContent className="flex-1 min-h-0 overflow-y-auto pb-4">
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
              <label
                htmlFor="default-mode"
                className="block mb-3 font-medium text-gray-900 text-sm/6"
              >
                {t("wordsets.editor.defaultTestMode")}
              </label>
              <div className="grid grid-cols-1 mt-2">
                <select
                  id="default-mode"
                  value={defaultMode}
                  onChange={(e) => setDefaultMode(e.target.value as TestMode)}
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                >
                  {TEST_MODES.map((mode) => {
                    const modeDefinition = getMode(mode);
                    if (!modeDefinition) return null;
                    return (
                      <option key={mode} value={mode}>
                        {t(
                          modeDefinition.metadata.nameKey as Parameters<
                            typeof t
                          >[0],
                        )}{" "}
                        -{" "}
                        {t(
                          modeDefinition.metadata.descriptionKey as Parameters<
                            typeof t
                          >[0],
                        )}
                      </option>
                    );
                  })}
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
                    {t("wordsets.editor.translationDirection")
                      .replace(
                        "{source}",
                        selectedLanguage === "en"
                          ? t("common.english")
                          : t("common.norwegian"),
                      )
                      .replace(
                        "{target}",
                        targetLanguage === "en"
                          ? t("common.english")
                          : t("common.norwegian"),
                      )}
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

              {/* Add/Edit Word Form - Always visible */}
              <div className="p-4 mt-6 border border-nordic-sky/30 rounded-lg bg-nordic-sky/10">
                {editingWordId && (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-nordic-midnight">
                      {t("wordsets.editor.editingWord")}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      {t("wordsets.cancel")}
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 mb-3 md:grid-cols-2">
                  <div>
                    <input
                      ref={newWordRef}
                      type="text"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      onBlur={handleWordBlur}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                      placeholder={
                        defaultMode === "translation"
                          ? t("wordsets.editor.sourceWord").replace(
                              "{lang}",
                              selectedLanguage,
                            )
                          : t("wordsets.addWord.placeholder")
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (defaultMode === "translation") {
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
                      onChange={(e) => {
                        setNewTranslationText(e.target.value);
                        if (translationError && e.target.value.trim()) {
                          setTranslationError(false);
                        }
                      }}
                      onBlur={() => {
                        if (!newTranslationText.trim() && newWord.trim()) {
                          setTranslationError(true);
                        }
                      }}
                      className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${
                        translationError
                          ? "outline-red-300 focus:outline-red-500"
                          : "outline-gray-300 focus:outline-nordic-teal"
                      }`}
                      placeholder={t(
                        "wordsets.editor.translationRequired",
                      ).replace("{lang}", targetLanguage)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddWord();
                        }
                      }}
                    />
                    {translationError && (
                      <p className="mt-1 text-sm text-red-600">
                        {t("wordsets.editor.translationRequiredError")}
                      </p>
                    )}
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
                    {editingWordId
                      ? t("wordsets.editor.update")
                      : t("wordsets.add")}
                  </button>
                  {editingWordId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-md bg-gray-100 px-2.5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      {t("wordsets.cancel")}
                    </button>
                  )}
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
                      className={`flex items-center gap-3 p-3 border rounded-lg ${
                        editingWordId === word.id
                          ? "border-nordic-sky bg-nordic-sky/10"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {word.word}
                          </span>
                          <WordBadge text={word.word} />
                        </div>
                        <div className="text-sm text-gray-600">
                          {word.definition || (
                            <span className="italic text-gray-400">
                              {t("wordsets.editor.noDefinition")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditWord(word.id)}
                          className="p-1 text-nordic-sky rounded hover:text-nordic-sky/80 hover:bg-nordic-sky/10"
                          title={t("aria.editButton")}
                        >
                          <HeroPencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveWord(word.id)}
                          className="p-1 text-red-600 rounded hover:text-red-800 hover:bg-red-100"
                          title={t("aria.removeButton")}
                        >
                          <HeroTrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Child Assignment Section (parent only) */}
            {userData?.role === "parent" && (
              <div className="pt-6 mt-6 border-t border-gray-200">
                <ChildAssignmentSelector
                  wordSetId={initialData?.id}
                  assignedUserIds={assignedUserIds}
                  onAssignmentChange={setAssignedUserIds}
                  pendingMode={mode === "create"}
                />
              </div>
            )}
          </form>
        </ModalContent>

        <ModalActions className="mt-4 shrink-0 border-t border-gray-200 pt-4 sticky bottom-0 bg-white">
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
