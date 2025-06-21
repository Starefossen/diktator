import { Language } from "@/contexts/LanguageContext";

export interface WordData {
  en: string[];
  no: string[];
}

export const wordData: WordData = {
  en: [
    "hello",
    "world",
    "practice",
    "spelling",
    "dictionary",
    "computer",
    "beautiful",
    "language",
    "learning",
    "wonderful",
    "achievement",
    "excellence",
    "progress",
    "challenge",
    "adventure",
    "friendship",
    "happiness",
    "knowledge",
    "creative",
    "amazing",
  ],
  no: [
    "hallo",
    "verden",
    "praksis",
    "staving",
    "ordbok",
    "datamaskin",
    "vakker",
    "språk",
    "læring",
    "fantastisk",
    "prestasjon",
    "fortreffelighet",
    "fremgang",
    "utfordring",
    "eventyr",
    "vennskap",
    "lykke",
    "kunnskap",
    "kreativ",
    "utrolig",
  ],
};

export function getWords(language: Language): string[] {
  return wordData[language];
}
