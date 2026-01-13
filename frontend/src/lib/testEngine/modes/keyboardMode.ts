import { TestModeDefinition } from "../types";
import type { WordSet } from "@/types";
import { SquaresPlusIcon } from "@heroicons/react/24/outline";

/**
 * Keyboard Mode - Type It
 *
 * Type the word using the keyboard.
 * Tracks mastery, works with any content.
 */
export const keyboardMode: TestModeDefinition = {
  id: "keyboard",
  metadata: {
    icon: SquaresPlusIcon,
    nameKey: "modes.keyboard",
    descriptionKey: "modes.keyboard.desc",
  },
  inputType: "keyboard",
  tracksMastery: true,
  contentRequirements: {
    // No specific requirements - works with any content
  },
  isAvailable: (_wordSet: WordSet) => {
    return { available: true };
  },
};
