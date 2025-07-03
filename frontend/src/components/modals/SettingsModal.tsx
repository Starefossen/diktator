import React from "react";
import { WordSet, TestConfiguration } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { requiresUserInteractionForAudio } from "@/lib/audioPlayer";
import { HeroExclamationTriangleIcon } from "@/components/Icons";

interface SettingsModalProps {
  wordSet: WordSet;
  config: TestConfiguration;
  onConfigChange: (config: TestConfiguration) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function SettingsModal({
  wordSet,
  config,
  onConfigChange,
  onSave,
  onCancel,
}: SettingsModalProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {t("wordsets.settings")} - {wordSet.name}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t("wordsets.config.maxAttempts")}
            </label>
            <select
              value={config.maxAttempts}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  maxAttempts: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 {t("wordsets.config.attempt")}</option>
              <option value={2}>2 {t("wordsets.config.attempts")}</option>
              <option value={3}>
                3 {t("wordsets.config.attempts")} (
                {t("wordsets.config.default")})
              </option>
              <option value={4}>4 {t("wordsets.config.attempts")}</option>
              <option value={5}>5 {t("wordsets.config.attempts")}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.autoPlayAudio}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    autoPlayAudio: e.target.checked,
                  })
                }
                className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t("wordsets.config.autoPlayAudio")}
              </span>
            </label>
            {requiresUserInteractionForAudio() && config.autoPlayAudio && (
              <div className="p-2 text-xs border rounded text-amber-600 bg-amber-50 border-amber-200">
                <div className="flex items-start space-x-2">
                  <HeroExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{t("wordsets.safari.autoplayWarning")}</span>
                </div>
              </div>
            )}

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.shuffleWords}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    shuffleWords: e.target.checked,
                  })
                }
                className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t("wordsets.config.shuffleWords")}
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showCorrectAnswer}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    showCorrectAnswer: e.target.checked,
                  })
                }
                className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t("wordsets.config.showCorrectAnswer")}
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableAutocorrect}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    enableAutocorrect: e.target.checked,
                  })
                }
                className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t("wordsets.config.enableAutocorrect")}
              </span>
            </label>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {t("wordsets.config.timeLimit")} ({t("wordsets.config.optional")})
            </label>
            <input
              type="number"
              value={config.timeLimit || ""}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  timeLimit: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              placeholder={t("wordsets.config.noTimeLimit")}
              min="1"
              max="300"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("wordsets.config.timeLimitHelp")}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {t("wordsets.cancel")}
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t("wordsets.saveSettings")}
          </button>
        </div>
      </div>
    </div>
  );
}
