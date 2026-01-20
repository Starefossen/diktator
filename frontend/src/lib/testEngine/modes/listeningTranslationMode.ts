import { TestModeDefinition, TestModeContext } from "../types";
import type { WordSet, WordItem } from "@/types";
import { SpeakerWaveIcon } from "@heroicons/react/24/outline";

/**
 * Listening Translation Mode - Hear & Translate
 *
 * Listen to the word in one language, type the translation in another.
 * Unlike regular translation mode, the source word is hidden - audio is the primary stimulus.
 * Develops listening comprehension alongside translation skills.
 *
 * Research basis: Multiple modalities strengthen encoding (Paivio, 1986).
 * Combining auditory input with typed production develops phoneme-grapheme connections.
 *
 * Tracks mastery separately from visual translation mode to differentiate:
 * - "can translate when reading" (translation mode)
 * - "can translate when hearing" (listening translation mode)
 */
export const listeningTranslationMode: TestModeDefinition = {
  id: "listeningTranslation",
  metadata: {
    icon: SpeakerWaveIcon,
    nameKey: "modes.listeningTranslation",
    descriptionKey: "modes.listeningTranslation.desc",
  },
  inputType: "specialized",
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
