"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-4 text-center bg-nordic-birch">
      <div className="container px-4 mx-auto">
        <p className="text-sm text-gray-500">{t("footer.tagline")}</p>
        <p className="mt-1 text-xs text-gray-400">
          {t("footer.build")}{" "}
          {process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()}
        </p>
      </div>
    </footer>
  );
}
