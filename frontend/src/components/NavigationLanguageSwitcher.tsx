"use client";

import { useLanguage, Language } from "@/contexts/LanguageContext";
import { FlagIcon } from "./FlagIcon";

const flags = {
  no: {
    name: "Norsk",
  },
  en: {
    name: "English",
  },
};

export default function NavigationLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1">
      {(Object.keys(flags) as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          title={flags[lang].name}
          className={`
            relative p-2 rounded-md transition-all duration-200 hover:bg-gray-100
            ${
              language === lang
                ? "bg-blue-50 ring-2 ring-blue-500 ring-opacity-30"
                : "hover:bg-gray-50"
            }
          `}
        >
          <FlagIcon language={lang} className="w-6 h-4" />
          {language === lang && (
            <div className="absolute w-1 h-1 transform -translate-x-1/2 bg-blue-500 rounded-full -bottom-1 left-1/2"></div>
          )}
        </button>
      ))}
    </div>
  );
}
