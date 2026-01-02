import React from "react";
import { WordSet } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "./BaseModal";
import { HeroExclamationTriangleIcon } from "../Icons";

interface DeleteConfirmationModalProps {
  wordSet: WordSet;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  wordSet,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const { t } = useLanguage();

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title={t("wordsets.deleteConfirm")}
      size="md"
    >
      <ModalContent>
        <div className="sm:flex sm:items-start">
          <div className="mt-3 text-center sm:mt-0 sm:text-left">
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {t("wordsets.deleteConfirmMessage").replace(
                  "{name}",
                  wordSet.name,
                )}
              </p>
            </div>

            <div className="p-3 mt-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-start">
                <div className="shrink-0">
                  <HeroExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {t("wordsets.deleteWarning")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalActions>
        {/* Primary action (dangerous) first in DOM */}
        <ModalButton onClick={onConfirm} variant="danger" disabled={isDeleting}>
          {isDeleting ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
              {t("wordsets.deleting")}
            </>
          ) : (
            t("wordsets.delete")
          )}
        </ModalButton>
        <ModalButton
          onClick={onCancel}
          variant="secondary"
          disabled={isDeleting}
          className="mt-3 sm:mt-0 sm:mr-3"
        >
          {t("wordsets.cancel")}
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
