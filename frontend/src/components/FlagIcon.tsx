"use client";

interface FlagIconProps {
  language: "no" | "en";
  className?: string;
}

const languageToFlag = {
  no: "no",
  en: "gb",
};

export function FlagIcon({ language, className = "w-4 h-4" }: FlagIconProps) {
  const flagCode = languageToFlag[language];

  return (
    <span
      className={`fi fi-${flagCode} rounded-sm overflow-hidden inline-block ${className}`}
      style={{
        backgroundSize: "cover",
        minWidth: "16px",
        minHeight: "12px",
      }}
    />
  );
}
