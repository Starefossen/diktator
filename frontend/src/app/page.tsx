"use client";

import Link from "next/link";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Icons,
  HeroRocketIcon,
  HeroBookIcon,
  HeroCheckIcon,
} from "@/components/Icons";

export default function HomePage() {
  const { status } = useApiStatus();
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20"></div>
        <div className="relative py-16 text-center">
          <div className="mb-6">
            <h1 className="mb-4 text-5xl font-bold text-transparent md:text-6xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              {t("home.welcome")}
            </h1>
            <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
          </div>
          <p className="max-w-2xl mx-auto mb-8 text-xl text-gray-700 md:text-2xl">
            {t("home.subtitle")}
          </p>
        </div>
      </div>

      {/* API Status Indicator - Moved to less prominent position */}
      <div className="fixed z-40 top-20 right-4">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${status === "connected"
            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
            : status === "error"
              ? "bg-red-100 text-red-800 ring-1 ring-red-200"
              : "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
            }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-2 ${status === "connected"
              ? "bg-emerald-500"
              : status === "error"
                ? "bg-red-500"
                : "bg-amber-500"
              }`}
          ></span>
          API{" "}
          {status === "connected" ? (
            <Icons.success className="inline w-3 h-3 ml-1" />
          ) : status === "error" ? (
            <Icons.error className="inline w-3 h-3 ml-1" />
          ) : (
            <Icons.loading className="inline w-3 h-3 ml-1" />
          )}
        </div>
      </div>

      {/* Main Cards */}
      <div className="px-4 pb-16">
        <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-2">
          {/* Word Sets Card */}
          <div className="relative overflow-hidden transition-all duration-300 transform bg-white shadow-lg group rounded-2xl hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 translate-x-16 -translate-y-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200"></div>
            <div className="relative p-8">
              <div className="mb-4">
                <HeroRocketIcon className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                {t("home.wordsets.title")}
              </h2>
              <p className="mb-6 leading-relaxed text-gray-600">
                {t("home.wordsets.desc")}
              </p>
              {user ? (
                <Link
                  href="/wordsets/"
                  className="inline-flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 shadow-md bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 hover:shadow-lg group"
                >
                  {t("home.wordsets.button")}
                  <svg
                    className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              ) : (
                <Link
                  href="/auth/"
                  className="inline-flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 shadow-md bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 hover:shadow-lg group"
                >
                  {t("auth.signin.title")}
                  <svg
                    className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>

          {/* About Card */}
          <div className="relative overflow-hidden transition-all duration-300 transform bg-white shadow-lg group rounded-2xl hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 translate-x-16 -translate-y-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-200"></div>
            <div className="relative p-8">
              <div className="mb-4">
                <HeroBookIcon className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                {t("home.about.title")}
              </h2>
              <p className="mb-6 leading-relaxed text-gray-600">
                {t("home.about.desc")}
              </p>
              <Link
                href="/about/"
                className="inline-flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 shadow-md bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 hover:shadow-lg group"
              >
                {t("home.about.button")}
                <svg
                  className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
