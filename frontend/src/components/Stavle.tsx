"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/locales";

export type StavlePose =
  | "listening"
  | "celebrating"
  | "encouraging"
  | "waving"
  | "thinking"
  | "reading"
  | "pointing"
  | "sleeping"
  | "idle"
  | "idle-resting";

export type StavleSize = 48 | 64 | 96 | 128 | 160 | 200;

export interface StavleProps {
  pose: StavlePose;
  size?: StavleSize;
  animate?: boolean;
  className?: string;
  "aria-hidden"?: boolean;
}

interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SpriteData {
  frames: Record<string, SpriteFrame>;
  meta: {
    size: { w: number; h: number };
  };
}

export const SPRITE_DATA: SpriteData = {
  frames: {
    "stavle-listening": { x: 0, y: 44, w: 309, h: 385 },
    "stavle-celebrating": { x: 308, y: 50, w: 353, h: 386 },
    "stavle-encouraging": { x: 660, y: 44, w: 320, h: 384 },
    "stavle-waving": { x: 11, y: 447, w: 341, h: 384 },
    "stavle-thinking": { x: 349, y: 465, w: 341, h: 384 },
    "stavle-reading": { x: 691, y: 465, w: 337, h: 384 },
    "stavle-pointing": { x: 0, y: 841, w: 341, h: 384 },
    "stavle-sleeping": { x: 340, y: 847, w: 352, h: 295 },
    "stavle-idle": { x: 693, y: 850, w: 342, h: 384 },
    "stavle-idle-resting": { x: 310, y: 1143, w: 443, h: 267 },
  },
  meta: {
    size: { w: 1024, h: 1536 },
  },
};

const POSE_TO_ARIA_KEY: Record<StavlePose, TranslationKey> = {
  listening: "aria.stavle.listening",
  celebrating: "aria.stavle.celebrating",
  encouraging: "aria.stavle.encouraging",
  waving: "aria.stavle.waving",
  thinking: "aria.stavle.thinking",
  reading: "aria.stavle.reading",
  pointing: "aria.stavle.pointing",
  sleeping: "aria.stavle.sleeping",
  idle: "aria.stavle.idle",
  "idle-resting": "aria.stavle.idleResting",
};

const ANIMATION_CLASSES: Partial<Record<StavlePose, string>> = {
  celebrating: "animate-stavle-bounce",
  encouraging: "animate-stavle-nod",
  sleeping: "animate-stavle-breathe",
  idle: "animate-stavle-bob",
  "idle-resting": "animate-stavle-bob",
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

  const frameKey = `stavle-${pose}`;
  const frame = SPRITE_DATA.frames[frameKey];

  if (!frame) {
    console.warn(`Stavle: Unknown pose "${pose}"`);
    return null;
  }

  const { w: sheetWidth, h: sheetHeight } = SPRITE_DATA.meta.size;
  const { x, y, w: frameWidth, h: frameHeight } = frame;

  const aspectRatio = frameHeight / frameWidth;
  const displayWidth = size;
  const displayHeight = Math.round(size * aspectRatio);

  const scaleX = displayWidth / frameWidth;
  const scaleY = displayHeight / frameHeight;

  const bgWidth = sheetWidth * scaleX;
  const bgHeight = sheetHeight * scaleY;

  const bgPosX = -x * scaleX;
  const bgPosY = -y * scaleY;

  const shouldAnimate = animate && !prefersReducedMotion;
  const animationClass = shouldAnimate ? ANIMATION_CLASSES[pose] || "" : "";

  const ariaLabel = t(POSE_TO_ARIA_KEY[pose]);

  return (
    <div
      role={ariaHidden ? undefined : "img"}
      aria-label={ariaHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden}
      className={`inline-block ${animationClass} ${className}`.trim()}
      style={{
        width: displayWidth,
        height: displayHeight,
        backgroundImage: "url(/stavle-sprite.png)",
        backgroundSize: `${bgWidth}px ${bgHeight}px`,
        backgroundPosition: `${bgPosX}px ${bgPosY}px`,
        backgroundRepeat: "no-repeat",
      }}
      data-testid={`stavle-${pose}`}
    />
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
