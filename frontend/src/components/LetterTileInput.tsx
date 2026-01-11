"use client";

import React, { useState } from "react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import type { LetterTile } from "@/lib/challenges";

interface LetterTileInputProps {
  tiles: LetterTile[];
  expectedWord: string;
  onSubmit: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
}

/**
 * LetterTileInput provides a tap-to-place letter tile interface for spelling words.
 *
 * Features:
 * - 48px+ touch targets for WCAG 2.1 AA compliance
 * - Tap available tile to place in next slot
 * - Tap placed tile to return to available pool
 * - Visual feedback with nordic color scheme
 * - Keyboard accessible with proper ARIA labels
 */
export function LetterTileInput({
  tiles,
  expectedWord,
  onSubmit,
  disabled = false,
}: LetterTileInputProps) {
  const { t } = useLanguage();

  // Track which tiles have been placed and in what order
  const [placedTileIds, setPlacedTileIds] = useState<string[]>([]);

  // Get available (unplaced) tiles
  const availableTiles = tiles.filter(
    (tile) => !placedTileIds.includes(tile.id),
  );

  // Get placed tiles in order
  const placedTiles = placedTileIds
    .map((id) => tiles.find((t) => t.id === id))
    .filter((t): t is LetterTile => t !== undefined);

  // Build the current answer string
  const currentAnswer = placedTiles.map((t) => t.letter).join("");

  // Handle tapping an available tile to place it
  function handlePlaceTile(tile: LetterTile) {
    if (disabled) return;
    if (placedTileIds.length >= expectedWord.length) return;
    setPlacedTileIds((prev) => [...prev, tile.id]);
  }

  // Handle tapping a placed tile to remove it
  function handleRemoveTile(tileId: string) {
    if (disabled) return;
    setPlacedTileIds((prev) => prev.filter((id) => id !== tileId));
  }

  // Handle clearing all placed tiles
  function handleClear() {
    if (disabled) return;
    setPlacedTileIds([]);
  }

  // Handle submit
  function handleSubmit() {
    if (disabled) return;
    if (placedTileIds.length !== expectedWord.length) return;
    const isCorrect =
      currentAnswer.toLowerCase() === expectedWord.toLowerCase();
    onSubmit(isCorrect, currentAnswer);
  }

  // Create empty slots for visual guidance
  const slots = Array.from({ length: expectedWord.length }, (_, i) => ({
    index: i,
    tile: placedTiles[i] || null,
  }));

  const isComplete = placedTileIds.length === expectedWord.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Answer slots area */}
      <div
        className="flex flex-wrap justify-center gap-2 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 min-h-20"
        role="group"
        aria-label={t("challenge.answerArea" as TranslationKey)}
      >
        {slots.map((slot) => (
          <button
            key={slot.index}
            type="button"
            onClick={() => slot.tile && handleRemoveTile(slot.tile.id)}
            disabled={disabled || !slot.tile}
            className={`
              min-w-12 min-h-12 w-12 h-12
              rounded-lg font-bold text-xl uppercase
              transition-all duration-150
              focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
              ${
                slot.tile
                  ? "bg-nordic-sky text-white hover:bg-nordic-sky/80 cursor-pointer shadow-md"
                  : "bg-white border-2 border-gray-300 text-gray-400 cursor-default"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            aria-label={
              slot.tile
                ? `${t("challenge.removeLetter" as TranslationKey)} ${slot.tile.letter.toUpperCase()}`
                : `${t("challenge.emptySlot" as TranslationKey)} ${slot.index + 1}`
            }
          >
            {slot.tile?.letter || ""}
          </button>
        ))}
      </div>

      {/* Available tiles */}
      <div
        className="flex flex-wrap justify-center gap-2"
        role="group"
        aria-label={t("challenge.availableLetters" as TranslationKey)}
      >
        {availableTiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            onClick={() => handlePlaceTile(tile)}
            disabled={disabled || isComplete}
            className={`
              min-w-12 min-h-12 w-12 h-12
              rounded-lg font-bold text-xl uppercase
              bg-white border-2 border-gray-300
              hover:border-nordic-sky hover:bg-nordic-sky/10
              active:scale-95
              transition-all duration-150
              focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
              ${disabled || isComplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${tile.isDistractor ? "text-gray-700" : "text-gray-900"}
            `}
            aria-label={`${t("challenge.placeLetter" as TranslationKey)} ${tile.letter.toUpperCase()}`}
          >
            {tile.letter}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 mt-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || placedTileIds.length === 0}
          className={`
            px-6 py-3 min-h-12
            rounded-lg font-semibold
            bg-gray-100 text-gray-700
            hover:bg-gray-200
            transition-colors duration-150
            focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
            ${disabled || placedTileIds.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
          aria-label={t("challenge.clearAll" as TranslationKey)}
        >
          {t("challenge.clear" as TranslationKey)}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !isComplete}
          className={`
            px-6 py-3 min-h-12
            rounded-lg font-semibold
            bg-nordic-sky text-white
            hover:bg-nordic-sky/90
            transition-colors duration-150
            focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
            ${disabled || !isComplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {t("challenge.check" as TranslationKey)}
        </button>
      </div>

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {currentAnswer
          ? `${t("challenge.currentAnswer" as TranslationKey)}: ${currentAnswer.toUpperCase()}`
          : t("challenge.noLettersPlaced" as TranslationKey)}
      </div>
    </div>
  );
}
