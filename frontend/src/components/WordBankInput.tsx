"use client";

import React, { useState } from "react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import type { WordBankItem } from "@/lib/challenges";

interface WordBankInputProps {
  items: WordBankItem[];
  expectedWordCount: number;
  onSubmit: (answer: string, isCorrect: boolean) => void;
  disabled?: boolean;
}

/**
 * WordBankInput provides a tap-to-select word bank interface for sentence construction.
 *
 * Features:
 * - 48px+ touch targets for WCAG 2.1 AA compliance
 * - Tap available word to add to sentence
 * - Tap selected word to remove from sentence
 * - Visual feedback showing selected state
 * - Keyboard accessible with proper ARIA labels
 */
export function WordBankInput({
  items,
  expectedWordCount,
  onSubmit,
  disabled = false,
}: WordBankInputProps) {
  const { t } = useLanguage();

  // Track which items have been selected and in what order
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Get available (unselected) items
  const availableItems = items.filter(
    (item) => !selectedItemIds.includes(item.id),
  );

  // Get selected items in order
  const selectedItems = selectedItemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is WordBankItem => item !== undefined);

  // Build the current answer string
  const currentAnswer = selectedItems.map((item) => item.word).join(" ");

  // Handle tapping an available item to select it
  function handleSelectItem(item: WordBankItem) {
    if (disabled) return;
    setSelectedItemIds((prev) => [...prev, item.id]);
  }

  // Handle tapping a selected item to deselect it
  function handleDeselectItem(itemId: string) {
    if (disabled) return;
    setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
  }

  // Handle clearing all selected items
  function handleClear() {
    if (disabled) return;
    setSelectedItemIds([]);
  }

  // Handle submit
  function handleSubmit() {
    if (disabled) return;
    if (selectedItemIds.length === 0) return;
    onSubmit(currentAnswer, true);
  }

  const hasSelection = selectedItemIds.length > 0;

  // Create placeholder slots for expected words
  const slots = Array.from({ length: expectedWordCount }, (_, i) => ({
    index: i,
    item: selectedItems[i] || null,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Selected words area (sentence being built) - shows slots like Letter Tiles */}
      <div
        className="flex flex-wrap justify-center gap-2 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 min-h-20"
        role="group"
        aria-label={t("challenge.sentenceArea" as TranslationKey)}
      >
        {slots.map((slot) =>
          slot.item ? (
            <button
              key={slot.item.id}
              type="button"
              onClick={() => handleDeselectItem(slot.item!.id)}
              disabled={disabled}
              className={`
                px-4 py-2 min-h-12
                rounded-lg font-semibold text-base
                bg-nordic-sky text-white
                hover:bg-nordic-sky/80
                active:scale-95
                transition-all duration-150
                focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
                shadow-md
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
              aria-label={`${t("challenge.removeWord" as TranslationKey)} ${slot.item.word}`}
            >
              {slot.item.word}
            </button>
          ) : (
            <span
              key={`empty-${slot.index}`}
              className="px-6 py-2 min-h-12 min-w-16 rounded-lg border-2 border-gray-300 bg-white flex items-center justify-center text-gray-400"
            >
              —
            </span>
          ),
        )}
      </div>

      {/* Available words */}
      <div
        className="flex flex-wrap justify-center gap-2"
        role="group"
        aria-label={t("challenge.availableWords" as TranslationKey)}
      >
        {availableItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelectItem(item)}
            disabled={disabled}
            className={`
              px-4 py-2 min-h-12
              rounded-lg font-semibold text-base
              bg-white border-2 border-gray-300
              hover:border-nordic-sky hover:bg-nordic-sky/10
              active:scale-95
              transition-all duration-150
              focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${item.isDistractor ? "text-gray-700" : "text-gray-900"}
            `}
            aria-label={`${t("challenge.addWord" as TranslationKey)} ${item.word}`}
          >
            {item.word}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 mt-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || !hasSelection}
          className={`
            px-6 py-3 min-h-12
            rounded-lg font-semibold
            bg-gray-100 text-gray-700
            hover:bg-gray-200
            transition-colors duration-150
            focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
            ${disabled || !hasSelection ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
          aria-label={t("challenge.clearAll" as TranslationKey)}
        >
          {t("challenge.clear" as TranslationKey)}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !hasSelection}
          className={`
            px-6 py-3 min-h-12
            rounded-lg font-semibold
            bg-nordic-sky text-white
            hover:bg-nordic-sky/90
            transition-colors duration-150
            focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
            ${disabled || !hasSelection ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {t("challenge.check" as TranslationKey)}
        </button>
      </div>

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {currentAnswer
          ? `${t("challenge.currentSentence" as TranslationKey)}: ${currentAnswer}`
          : t("challenge.noWordsSelected" as TranslationKey)}
      </div>
    </div>
  );
}
