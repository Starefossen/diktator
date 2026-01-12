"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/locales";

export type StavlePose =
  | "celebrating"
  | "encouraging"
  | "waving"
  | "thinking"
  | "reading"
  | "pointing"
  | "idle";

export type StavleSize = 48 | 64 | 96 | 128 | 160 | 200;

export interface StavleProps {
  pose: StavlePose;
  size?: StavleSize;
  animate?: boolean;
  className?: string;
  "aria-hidden"?: boolean;
}

const POSE_TO_ARIA_KEY: Record<StavlePose, TranslationKey> = {
  celebrating: "aria.stavle.celebrating",
  encouraging: "aria.stavle.encouraging",
  waving: "aria.stavle.waving",
  thinking: "aria.stavle.thinking",
  reading: "aria.stavle.reading",
  pointing: "aria.stavle.pointing",
  idle: "aria.stavle.idle",
};

const ANIMATION_CLASSES: Partial<Record<StavlePose, string>> = {
  celebrating: "animate-stavle-bounce",
  encouraging: "animate-stavle-nod",
  idle: "animate-stavle-bob",
};

export default function Stavle({
  pose,
  size = 128,
  animate = false,
  className = "",
  "aria-hidden": ariaHidden,
}: StavleProps) {
  const { t } = useLanguage();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const shouldAnimate = animate && !prefersReducedMotion;
  const animationClass = shouldAnimate ? ANIMATION_CLASSES[pose] || "" : "";
  const ariaLabel = t(POSE_TO_ARIA_KEY[pose]);
  const imageSrc = `/stavle/stavle-${pose}.png`;

  return (
    <div
      className={`inline-block ${animationClass} ${className}`.trim()}
      data-testid={`stavle-${pose}`}
      style={{ height: size }}
    >
      <Image
        src={imageSrc}
        alt={ariaHidden ? "" : ariaLabel}
        width={size}
        height={size}
        aria-hidden={ariaHidden}
        className="h-full w-auto object-contain"
        priority={size >= 128}
      />
    </div>
  );
}

export function StavleWithMessage({
  pose,
  size = 128,
  animate = false,
  message,
  messagePosition = "below",
  className = "",
}: StavleProps & {
  message: string;
  messagePosition?: "above" | "below" | "left" | "right";
}) {
  const positionClasses: Record<string, string> = {
    above: "flex-col-reverse items-center",
    below: "flex-col items-center",
    left: "flex-row-reverse items-center",
    right: "flex-row items-center",
  };

  const gapClasses: Record<string, string> = {
    above: "gap-2",
    below: "gap-2",
    left: "gap-3",
    right: "gap-3",
  };

  return (
    <div
      className={`flex ${positionClasses[messagePosition]} ${gapClasses[messagePosition]} ${className}`}
    >
      <Stavle pose={pose} size={size} animate={animate} />
      <p className="text-center text-nordic-midnight text-sm max-w-xs">
        {message}
      </p>
    </div>
  );
}
