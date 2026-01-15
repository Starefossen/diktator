"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import Stavle from "@/components/Stavle";
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "@/components/modals/BaseModal";

interface TestExitModalProps {
  isOpen: boolean;
  onConfirmExit: () => void;
  onCancelExit: () => void;
  correctCount: number;
  totalAnswers: number;
  totalWords: number;
}

/**
 * Modal shown when user attempts to exit a test in progress.
 * Provides encouraging feedback and progress summary to help
 * user decide whether to continue or exit.
 */
export function TestExitModal({
  isOpen,
  onConfirmExit,
  onCancelExit,
  correctCount,
  totalAnswers,
  totalWords,
}: TestExitModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const scorePercent =
    totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0;

  // Context-aware message selection
  let message = "";
  let encouragement = "";

  if (totalAnswers === 0) {
    message = t("test.exitJustStarted");
    encouragement = t("test.exitEncouragement");
  } else if (totalAnswers >= totalWords - 1) {
    message = t("test.exitAlmostDone");
    encouragement = t("test.exitKeepGoing");
  } else if (scorePercent >= 80) {
    message = t("test.exitConfirmMessage")
      .replace("{{correct}}", String(correctCount))
      .replace("{{total}}", String(totalAnswers));
    encouragement = t("test.exitDoingGreat");
  } else {
    message = t("test.exitConfirmMessage")
      .replace("{{correct}}", String(correctCount))
      .replace("{{total}}", String(totalAnswers));
    encouragement = t("test.exitKeepGoing");
  }

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancelExit}
      title={t("test.exitConfirm")}
      size="md"
    >
      <ModalContent>
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Stavle pose="encouraging" size={96} animate />
          </div>

          <p className="mb-4 text-lg text-gray-700">{message}</p>

          {totalAnswers > 0 && (
            <div className="mb-2 rounded-xl border-2 border-nordic-sky/30 bg-nordic-sky/10 p-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-nordic-sky">
                  {correctCount}
                </span>
                <span className="text-xl text-gray-600">/</span>
                <span className="text-3xl font-bold text-gray-700">
                  {totalAnswers}
                </span>
              </div>
            </div>
          )}

          <p className="mt-3 text-sm font-medium text-nordic-midnight">
            {encouragement}
          </p>
        </div>
      </ModalContent>

      <ModalActions>
        <div className="flex w-full flex-col-reverse justify-center gap-3 sm:flex-row">
          <ModalButton
            onClick={onConfirmExit}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {t("test.exitConfirmButton")}
          </ModalButton>
          <ModalButton
            onClick={onCancelExit}
            variant="primary"
            className="w-full sm:w-auto"
          >
            {t("test.continueTest")}
          </ModalButton>
        </div>
      </ModalActions>
    </BaseModal>
  );
}
