import { TestModeDefinition, TestModeContext } from "../types";
import type { WordSet, WordItem } from "@/types";
import { LanguageIcon } from "@heroicons/react/24/outline";

/**
 * Translation Mode - Translate It
 *
 * Translate from Norwegian to English or vice versa.
 * Tracks mastery, requires translations on words.
 */
export const translationMode: TestModeDefinition = {
  id: "translation",
  metadata: {
    icon: LanguageIcon,
    nameKey: "modes.translation",
    descriptionKey: "modes.translation.desc",
  },
  inputType: "keyboard",
  tracksMastery: true,
  contentRequirements: {
    translations: true,
  },
  isAvailable: (wordSet: WordSet) => {
    const hasTranslations = wordSet.words.some(
      (w) => w.translations && w.translations.length > 0,
    );
    return {
      available: hasTranslations,
      reasonKey: hasTranslations ? undefined : "modes.requiresTranslations",
    };
  },
  getExpectedAnswer: (word: WordItem, context?: TestModeContext) => {
    const direction =
      (context?.translationDirection as "toTarget" | "toSource") ?? "toTarget";
    if (
      direction === "toTarget" &&
      word.translations &&
      word.translations.length > 0
    ) {
      return word.translations[0].text;
    }
    return word.word;
  },
};
