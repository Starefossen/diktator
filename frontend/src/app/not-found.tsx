"use client";

import { HomeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {t("error.notFound.title")}
        </h2>
        <p className="text-gray-600 mb-8">{t("error.notFound.description")}</p>
        <Button as="link" href="/" variant="primary">
          <HomeIcon className="h-5 w-5 mr-2" />
          {t("error.notFound.goHome")}
        </Button>
      </div>
    </div>
  );
}
