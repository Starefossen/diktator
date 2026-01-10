import React from "react";
import { WordSet, TestConfiguration } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { requiresUserInteractionForAudio } from "@/lib/audioPlayer";
import { HeroExclamationTriangleIcon } from "@/components/Icons";
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "./BaseModal";

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
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title={`${t("wordsets.settings")} - ${wordSet.name}`}
      size="md"
    >
      <ModalContent>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              {t("wordsets.config.maxAttempts")}
            </label>
            <div className="mt-2">
              <select
                value={config.maxAttempts}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    maxAttempts: parseInt(e.target.value),
                  })
                }
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-nordic-teal sm:text-sm sm:leading-6"
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
          </div>

          <div className="space-y-4">
            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  id="autoPlayAudio"
                  type="checkbox"
                  checked={config.autoPlayAudio}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      autoPlayAudio: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-nordic-teal focus:ring-nordic-teal"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label
                  htmlFor="autoPlayAudio"
                  className="font-medium text-gray-900"
                >
                  {t("wordsets.config.autoPlayAudio")}
                </label>
              </div>
            </div>

            {requiresUserInteractionForAudio() && config.autoPlayAudio && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <HeroExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      {t("wordsets.safari.autoplayWarning")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  id="shuffleWords"
                  type="checkbox"
                  checked={config.shuffleWords}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      shuffleWords: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-nordic-teal focus:ring-nordic-teal"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label
                  htmlFor="shuffleWords"
                  className="font-medium text-gray-900"
                >
                  {t("wordsets.config.shuffleWords")}
                </label>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  id="showCorrectAnswer"
                  type="checkbox"
                  checked={config.showCorrectAnswer}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      showCorrectAnswer: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-nordic-teal focus:ring-nordic-teal"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label
                  htmlFor="showCorrectAnswer"
                  className="font-medium text-gray-900"
                >
                  {t("wordsets.config.showCorrectAnswer")}
                </label>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  id="enableAutocorrect"
                  type="checkbox"
                  checked={config.enableAutocorrect}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      enableAutocorrect: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-nordic-teal focus:ring-nordic-teal"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label
                  htmlFor="enableAutocorrect"
                  className="font-medium text-gray-900"
                >
                  {t("wordsets.config.enableAutocorrect")}
                </label>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="timeLimit"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              {t("wordsets.config.timeLimit")} ({t("wordsets.config.optional")})
            </label>
            <div className="mt-2">
              <input
                id="timeLimit"
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
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-nordic-teal sm:text-sm sm:leading-6"
              />
              <p className="mt-2 text-sm text-gray-500">
                {t("wordsets.config.timeLimitHelp")}
              </p>
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalActions>
        {/* Primary action first in DOM for proper tab order and focus management */}
        <ModalButton onClick={onSave} variant="primary">
          {t("wordsets.saveSettings")}
        </ModalButton>
        <ModalButton
          onClick={onCancel}
          variant="secondary"
          className="mt-3 sm:mt-0 sm:mr-3"
        >
          {t("wordsets.cancel")}
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
