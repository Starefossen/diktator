import { useLanguage } from "@/contexts/LanguageContext";

export default function LoadingSpinner({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useLanguage();
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}
        aria-hidden="true"
      ></div>
      <span className="sr-only">{t("aria.loading")}</span>
    </div>
  );
}

export function LoadingPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{t("common.loading")}</p>
      </div>
    </div>
  );
}
