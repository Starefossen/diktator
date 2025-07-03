import React from "react";
import { WordSet } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { HeroTrashIcon } from "@/components/Icons";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <HeroTrashIcon className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {t("wordsets.deleteConfirm")}
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            {t("wordsets.deleteConfirmMessage").replace("{name}", wordSet.name)}
          </p>

          <div className="p-3 mb-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {t("wordsets.deleteWarning")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("wordsets.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                {t("wordsets.deleting")}
              </>
            ) : (
              <>
                <HeroTrashIcon className="w-4 h-4 mr-2 text-white" />
                {t("wordsets.delete")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
