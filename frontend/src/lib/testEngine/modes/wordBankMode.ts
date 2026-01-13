import { TestModeDefinition } from "../types";
import { generateWordBank } from "@/lib/challenges";
import type { WordSet } from "@/types";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

/**
 * Word Bank Mode - Sentence Building
 *
 * Select words from a bank to build the complete sentence.
 * Tracks mastery, requires sentences only.
 */
export const wordBankMode: TestModeDefinition = {
  id: "wordBank",
  metadata: {
    icon: DocumentTextIcon,
    nameKey: "modes.wordBank",
    descriptionKey: "modes.wordBank.desc",
  },
  inputType: "wordBank",
  tracksMastery: true,
  contentRequirements: {
    sentences: true,
  },
  isAvailable: (wordSet: WordSet) => {
    const hasSentences = wordSet.words.some((w) => w.word.includes(" "));
    return {
      available: hasSentences,
      reasonKey: hasSentences ? undefined : "modes.requiresSentences",
    };
  },
  generateChallenge: (word: string, context?) => {
    const wordBankItems = generateWordBank(word, context?.wordSet);
    return { wordBankItems };
  },
};
