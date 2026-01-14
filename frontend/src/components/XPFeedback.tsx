"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLevelInfo, XPInfo } from "@/types";
import Stavle from "./Stavle";

interface XPGainToastProps {
  xpInfo: XPInfo;
  onDismiss: () => void;
  autoDismissMs?: number;
}

/**
 * Toast notification showing XP gained after completing a test
 */
export function XPGainToast({
  xpInfo,
  onDismiss,
  autoDismissMs = 3000,
}: XPGainToastProps) {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, autoDismissMs);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <button
      className={`fixed top-20 right-4 z-50 transition-all duration-300 ease-out ${
        isVisible && !isExiting
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-4"
      }`}
      onClick={handleDismiss}
      role="alert"
      aria-label={
        language === "no" ? "Lukk XP-varsling" : "Dismiss XP notification"
      }
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-lg cursor-pointer hover:bg-gray-50">
        {/* XP Badge */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-nordic-sunrise to-nordic-cloudberry">
          <span className="text-sm font-bold text-white">XP</span>
        </div>

        {/* XP Info */}
        <div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-nordic-sunrise">
              +{xpInfo.awarded}
            </span>
            <span className="text-sm text-gray-500">XP</span>
          </div>
          <div className="text-xs text-gray-400">
            {language === "no" ? "Total:" : "Total:"}{" "}
            {xpInfo.total.toLocaleString()} XP
          </div>
        </div>

        {/* Level up indicator */}
        {xpInfo.levelUp && (
          <div className="px-2 py-1 text-xs font-semibold rounded-full bg-nordic-meadow/20 text-nordic-meadow">
            {language === "no" ? "Nivå opp!" : "Level Up!"}
          </div>
        )}
      </div>
    </button>
  );
}

interface LevelUpModalProps {
  xpInfo: XPInfo;
  onClose: () => void;
}

/**
 * Full-screen modal celebrating a level-up
 */
export function LevelUpModal({ xpInfo, onClose }: LevelUpModalProps) {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const levelInfo = getLevelInfo(xpInfo.level);
  const levelName = language === "no" ? levelInfo.nameNo : levelInfo.name;

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
    >
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-label={language === "no" ? "Lukk dialog" : "Close dialog"}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all duration-300 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Confetti/sparkle decoration */}
        <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden rounded-t-2xl bg-linear-to-b from-nordic-sunrise/20 to-transparent">
          <div className="absolute w-2 h-2 rounded-full top-4 left-8 bg-nordic-sky animate-pulse" />
          <div className="absolute w-3 h-3 rounded-full top-8 right-12 bg-nordic-meadow animate-pulse delay-100" />
          <div className="absolute w-2 h-2 rounded-full top-12 left-16 bg-nordic-cloudberry animate-pulse delay-200" />
          <div className="absolute w-2 h-2 rounded-full top-6 right-8 bg-nordic-sunrise animate-pulse delay-300" />
        </div>

        {/* Header */}
        <div className="relative text-center">
          <h2
            id="level-up-title"
            className="text-2xl font-bold text-transparent bg-linear-to-r from-nordic-sunrise to-nordic-cloudberry bg-clip-text"
          >
            {language === "no" ? "Nivå opp!" : "Level Up!"}
          </h2>
        </div>

        {/* Level Icon */}
        <div className="flex justify-center my-6">
          <div className="flex items-center justify-center w-24 h-24 text-4xl font-bold rounded-full bg-linear-to-br from-nordic-sunrise to-nordic-cloudberry text-white shadow-lg animate-bounce">
            {xpInfo.level}
          </div>
        </div>

        {/* Level Name */}
        <div className="mb-6 text-center">
          <p className="text-lg text-gray-600">
            {language === "no" ? "Du er nå" : "You are now a"}
          </p>
          <h3 className="text-3xl font-bold text-nordic-midnight">
            {levelName}
          </h3>
          <p className="text-sm text-gray-500">
            {language === "no" ? "Nivå" : "Level"} {xpInfo.level}
          </p>
        </div>

        {/* Stavle Celebration */}
        <div className="flex justify-center mb-6">
          <Stavle pose="celebrating" size={96} />
        </div>

        {/* XP Info */}
        <div className="px-4 py-3 mb-6 text-center rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500">
            {language === "no" ? "Total XP:" : "Total XP:"}{" "}
            <span className="font-semibold text-nordic-midnight">
              {xpInfo.total.toLocaleString()}
            </span>
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 text-lg font-semibold text-white transition-colors rounded-lg bg-linear-to-r from-nordic-sky to-nordic-teal hover:from-nordic-sky/90 hover:to-nordic-teal/90 min-h-12"
        >
          {language === "no" ? "Fortsett" : "Continue"}
        </button>
      </div>
    </div>
  );
}
