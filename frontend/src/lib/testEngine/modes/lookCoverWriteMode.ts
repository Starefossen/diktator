import { TestModeDefinition } from "../types";
import type { WordSet } from "@/types";
import { LightBulbIcon } from "@heroicons/react/24/outline";

/**
 * Look Cover Write Mode - Memory Spell
 *
 * Look at the word, cover it, write it from memory, then check.
 * Does NOT track mastery (self-report mode).
 * Works with any content.
 */
export const lookCoverWriteMode: TestModeDefinition = {
  id: "lookCoverWrite",
  metadata: {
    icon: LightBulbIcon,
    nameKey: "modes.lookCoverWrite",
    descriptionKey: "modes.lookCoverWrite.desc",
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
