import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Hook to get a deterministic variant of button text based on a seed string (e.g., wordset ID).
 * This prevents the buttons from looking too repetitive while keeping them consistent for each item.
 *
 * @param seed - The string to use for deterministic selection (usually wordset.id)
 * @param hasTakenBefore - Whether the user has taken this test before
 * @returns The selected button text variant
 */
export function useButtonVariant(
  seed: string,
  hasTakenBefore: boolean,
): string {
  const { t } = useLanguage();

  return useMemo(() => {
    const variants = hasTakenBefore
      ? [
          t("test.tryAgain.v1"),
          t("test.tryAgain.v2"),
          t("test.tryAgain.v3"),
          t("test.tryAgain.v4"),
        ]
      : [
          t("wordsets.go.v1"),
          t("wordsets.go.v2"),
          t("wordsets.go.v3"),
          t("wordsets.go.v4"),
        ];

    // Simple hash function for deterministic selection
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    const index = Math.abs(hash) % variants.length;
    return variants[index];
  }, [seed, hasTakenBefore, t]);
}
