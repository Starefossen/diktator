"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

interface AudioErrorDisplayProps {
  error: string; // Translation key or raw message
  details?: string;
  onDismiss?: () => void;
}

export function AudioErrorDisplay({
  error,
  details,
  onDismiss,
}: AudioErrorDisplayProps) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  // Translate the error message if it's a translation key, otherwise use as-is
  const errorMessage = error.startsWith("audio.error.")
    ? t(error as keyof typeof t)
    : error;

  return (
    <div
      className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4 shadow-sm"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon
          className="h-6 w-6 shrink-0 text-yellow-600"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-gray-900">{errorMessage}</p>

          {details && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 min-h-12"
                aria-expanded={showDetails}
                aria-label={
                  showDetails
                    ? t("audio.error.hideDetails")
                    : t("audio.error.showDetails")
                }
              >
                {showDetails ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                    {t("audio.error.hideDetails")}
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                    {t("audio.error.showDetails")}
                  </>
                )}
              </button>

              {showDetails && (
                <div className="mt-2 rounded bg-gray-100 p-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {t("audio.error.technicalDetails")}
                  </p>
                  <pre className="whitespace-pre-wrap wrap-break-word text-xs font-mono text-gray-600">
                    {details}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 rounded-full p-2 text-gray-500 hover:bg-yellow-100 hover:text-gray-700 min-h-12 min-w-12"
            aria-label={t("audio.error.dismiss")}
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
