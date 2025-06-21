"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getWords } from "@/data/words";
import { saveTestResult } from "@/lib/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function PracticePage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [currentWord, setCurrentWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const words = getWords(language);

  const handleNewWord = useCallback(() => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
    setUserInput("");

    // Start timer on first word
    if (!startTime) {
      setStartTime(new Date());
    }
  }, [words, startTime]);

  useEffect(() => {
    // Reset current word when language changes
    if (currentWord) {
      handleNewWord();
    }
  }, [language, currentWord, handleNewWord]);

  const saveResult = async () => {
    if (!user || !startTime || totalAttempts === 0) return;

    const timeSpent = Math.round(
      (new Date().getTime() - startTime.getTime()) / 1000,
    );

    try {
      await saveTestResult({
        userId: user.uid,
        wordSetName: "Random Practice",
        language,
        score: Math.round((score / totalAttempts) * 100),
        totalWords: totalAttempts,
        correctWords: score,
        timeSpent,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save test result:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTotalAttempts = totalAttempts + 1;
    setTotalAttempts(newTotalAttempts);

    if (userInput.toLowerCase() === currentWord.toLowerCase()) {
      const newScore = score + 1;
      setScore(newScore);
      alert(t("correct"));
    } else {
      alert(`${t("not.quite")} ${currentWord}`);
    }

    // Save result every 5 words
    if (newTotalAttempts % 5 === 0) {
      await saveResult();
    }

    handleNewWord();
  };

  return (
    <ProtectedRoute>
      <div className="py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            {t("spelling.practice")}
          </h1>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className="text-sm text-gray-600 mb-2">
                {t("score")}: {score}/{totalAttempts} (
                {totalAttempts > 0
                  ? Math.round((score / totalAttempts) * 100)
                  : 0}
                %)
              </div>
              <button
                onClick={handleNewWord}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {currentWord ? t("new.word") : t("start.practice")}
              </button>
            </div>

            {currentWord && (
              <div className="text-center">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {t("spell.this.word")}
                  </h2>
                  <div className="text-4xl font-bold text-gray-300 mb-4 blur-sm hover:blur-none hover:text-blue-600 transition-all duration-300 select-none">
                    {currentWord}
                  </div>
                  <button
                    onClick={() => {
                      const utterance = new SpeechSynthesisUtterance(
                        currentWord,
                      );
                      utterance.lang = language === "no" ? "nb-NO" : "en-US";
                      speechSynthesis.speak(utterance);
                    }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                  >
                    🔊 {t("listen")}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={t("type.word.here")}
                    className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    {t("check.spelling")}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
