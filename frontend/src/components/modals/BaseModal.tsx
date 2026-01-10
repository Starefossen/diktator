import React, { useEffect, useRef } from "react";
import { HeroXMarkIcon } from "@/components/Icons";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export function BaseModal({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
  showCloseButton = true,
}: BaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open while preserving scrollbar space
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity duration-300 ease-out bg-gray-500/75"
        onClick={handleBackdropClick}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal container */}
      <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
        <div
          ref={modalRef}
          className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all duration-300 ease-out w-full mx-4 ${sizeClasses[size]} ${size === "xl" ? "max-h-[90vh] overflow-hidden" : ""
            }`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          {showCloseButton && (
            <div className="absolute top-0 right-0 z-10 pt-4 pr-4">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 transition-colors bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-nordic-teal focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <HeroXMarkIcon className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <h3 className="pr-8 text-base font-semibold leading-6 text-gray-900">
              {title}
            </h3>
          </div>

          {/* Content */}
          <div className={size === "xl" ? "flex-1 overflow-y-auto" : ""}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalContent({ children, className = "" }: ModalContentProps) {
  return <div className={`px-4 py-5 sm:p-6 ${className}`}>{children}</div>;
}

interface ModalActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalActions({ children, className = "" }: ModalActionsProps) {
  return (
    <div
      className={`bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 ${className}`}
    >
      {children}
    </div>
  );
}

// Consistent button components
interface ModalButtonProps {
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ModalButton({
  onClick,
  variant = "secondary",
  disabled = false,
  loading = false,
  children,
  className = "",
}: ModalButtonProps) {
  const baseClasses =
    "inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto";

  const variantClasses = {
    primary:
      "bg-nordic-sky text-white hover:bg-nordic-sky/90 focus:ring-nordic-teal",
    secondary:
      "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring-nordic-teal",
    danger: "bg-red-600 text-white hover:bg-red-500 focus:ring-red-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
}
