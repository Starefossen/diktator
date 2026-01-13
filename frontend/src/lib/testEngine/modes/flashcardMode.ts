import { TestModeDefinition } from "../types";
import type { WordSet } from "@/types";
import { EyeIcon } from "@heroicons/react/24/outline";

/**
 * Flashcard Mode - Quick Look
 *
 * Look at the word, then self-report if you knew it.
 * Does NOT track mastery (self-report mode).
 * Works with any content.
 */
export const flashcardMode: TestModeDefinition = {
  id: "flashcard",
  metadata: {
    icon: EyeIcon,
    nameKey: "modes.flashcard",
    descriptionKey: "modes.flashcard.desc",
  },
  inputType: "specialized",
  tracksMastery: false,
  contentRequirements: {
    // No specific requirements - works with any content
  },
  isAvailable: (_wordSet: WordSet) => {
    return { available: true };
  },
};
