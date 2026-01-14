"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getLevelInfo, getLevelProgress } from "@/types";

interface XPIndicatorProps {
  totalXp: number;
  level: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  className?: string;
}

/**
 * XPIndicator displays the user's current level, XP, and progress to next level.
 * Designed for the app header but can be used elsewhere.
 */
export function XPIndicator({
  totalXp,
  level,
  size = "md",
  showProgress = true,
  className = "",
}: XPIndicatorProps) {
  const { language } = useLanguage();
  const levelInfo = getLevelInfo(level);
  const progress = getLevelProgress(totalXp);
  const nextLevelInfo = getLevelInfo(level + 1);
  const xpToNext = Math.max(0, nextLevelInfo.totalXp - totalXp);

  const levelName = language === "no" ? levelInfo.nameNo : levelInfo.name;
  const nextLevelName =
    language === "no" ? nextLevelInfo.nameNo : nextLevelInfo.name;
  const toNextLevelText =
    language === "no" ? "til neste nivå" : "to next level";

  const sizeClasses = {
    sm: {
      container: "gap-1.5",
      icon: "w-6 h-6",
      text: "text-xs",
      progress: "h-1",
    },
    md: {
      container: "gap-2",
      icon: "w-8 h-8",
      text: "text-sm",
      progress: "h-1.5",
    },
    lg: {
      container: "gap-3",
      icon: "w-12 h-12",
      text: "text-base",
      progress: "h-2",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`flex items-center ${classes.container} ${className}`}
      title={`${xpToNext} XP ${toNextLevelText}`}
    >
      {/* Level Icon */}
      <div className="relative shrink-0">
        <div
          className={`${classes.icon} rounded-full bg-linear-to-br from-nordic-sunrise/20 to-nordic-cloudberry/20 flex items-center justify-center overflow-hidden`}
        >
          {/* Placeholder for level icon - will use actual icons when available */}
          <span className={`font-bold text-nordic-midnight ${classes.text}`}>
            {level}
          </span>
        </div>
      </div>

      {/* Level Info and Progress */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-semibold text-nordic-midnight truncate ${classes.text}`}
          >
            {levelName}
          </span>
          <span className={`text-gray-500 ${classes.text}`}>
            {totalXp.toLocaleString()} XP
          </span>
        </div>

        {showProgress && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Progress bar */}
            <div
              className={`flex-1 bg-gray-200 rounded-full overflow-hidden min-w-16 ${classes.progress}`}
              title={
                xpToNext > 0
                  ? `${xpToNext} XP ${toNextLevelText}`
                  : "Maximum level reached"
              }
            >
              <div
                className="h-full rounded-full bg-linear-to-r from-nordic-sunrise to-nordic-cloudberry transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Next level indicator */}
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {xpToNext > 0 ? `→ ${nextLevelName}` : "MAX"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact XP indicator for mobile or tight spaces
 */
export function XPIndicatorCompact({
  totalXp,
  level,
  className = "",
}: {
  totalXp: number;
  level: number;
  className?: string;
}) {
  const { language } = useLanguage();
  const levelInfo = getLevelInfo(level);
  const progress = getLevelProgress(totalXp);
  const levelName = language === "no" ? levelInfo.nameNo : levelInfo.name;
  const nextLevelInfo = getLevelInfo(level + 1);
  const xpToNext = Math.max(0, nextLevelInfo.totalXp - totalXp);

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      title={`${levelName} • ${totalXp} XP • ${xpToNext > 0 ? `${xpToNext} til neste nivå` : "MAX"}`}
    >
      {/* Level badge */}
      <div className="flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full bg-linear-to-br from-nordic-sunrise to-nordic-cloudberry text-white shadow-sm">
        {level}
      </div>
      {/* Level name (hidden on very small screens) */}
      <span className="hidden sm:inline text-xs font-semibold text-nordic-midnight truncate max-w-20">
        {levelName}
      </span>
      {/* Mini progress bar */}
      <div className="w-12 sm:w-16 h-1.5 overflow-hidden bg-gray-200 rounded-full">
        <div
          className="h-full rounded-full bg-linear-to-r from-nordic-sunrise to-nordic-cloudberry transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
