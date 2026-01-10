import { useLanguage } from "@/contexts/LanguageContext";
import Stavle from "@/components/Stavle";

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
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-nordic-sky`}
        aria-hidden="true"
      ></div>
      <span className="sr-only">{t("aria.loading")}</span>
    </div>
  );
}

export function LoadingPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-nordic-birch">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Stavle pose="idle" size={96} animate aria-hidden />
        </div>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{t("common.loading")}</p>
      </div>
    </div>
  );
}
