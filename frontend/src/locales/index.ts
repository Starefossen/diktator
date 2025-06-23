import { en } from "./en";
import { no } from "./no";

export const translations = {
  en,
  no,
};

export type Language = "en" | "no";
export type TranslationKey = keyof typeof en;
