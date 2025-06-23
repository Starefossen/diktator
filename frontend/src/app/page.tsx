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
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
            status === "connected"
              ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
              : status === "error"
                ? "bg-red-100 text-red-800 ring-1 ring-red-200"
                : "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-2 ${
              status === "connected"
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
                  href="/auth"
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

        {/* Development Progress Bar */}
        <div className="max-w-6xl mx-auto mt-16">
          <div className="p-8 bg-white shadow-lg rounded-2xl">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                {t("home.progress.title")}
              </h2>
              <p className="text-gray-600">{t("home.progress.subtitle")}</p>
            </div>

            {/* Progress Bar Container */}
            <div className="relative mb-8">
              {/* Progress Line */}
              <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full top-6">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                  style={{ width: "75%" }}
                ></div>
              </div>

              {/* Phase Indicators */}
              <div className="relative flex justify-between">
                {/* Phase 0 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-full shadow-lg bg-emerald-500">
                    ✓
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-emerald-700">
                      {t("home.progress.phase0.title")}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {t("home.progress.phase0.subtitle")}
                    </p>
                  </div>
                </div>

                {/* Phase 1 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-full shadow-lg bg-emerald-500">
                    ✓
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-emerald-700">
                      {t("home.progress.phase1.title")}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {t("home.progress.phase1.subtitle")}
                    </p>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white bg-blue-500 rounded-full shadow-lg animate-pulse">
                    ✓
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-blue-700">
                      {t("home.progress.phase2.title")}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {t("home.progress.phase2.subtitle")}
                    </p>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-gray-500 bg-gray-300 rounded-full">
                    3
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-gray-500">
                      {t("home.progress.phase3.title")}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {t("home.progress.phase3.subtitle")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase Details Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Phase 0 Details */}
              <div className="p-4 border rounded-lg border-emerald-200 bg-emerald-50">
                <h4 className="mb-3 font-semibold text-emerald-800">
                  {t("home.progress.phase0.title")}
                </h4>
                <ul className="space-y-2 text-sm text-emerald-700">
                  <li className="flex items-start">
                    <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-emerald-600 flex-shrink-0" />
                    {t("home.progress.phase0.point1")}
                  </li>
                  <li className="flex items-start">
                    <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-emerald-600 flex-shrink-0" />
                    {t("home.progress.phase0.point2")}
                  </li>
                  <li className="flex items-start">
                    <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-emerald-600 flex-shrink-0" />
                    {t("home.progress.phase0.point3")}
                  </li>
                </ul>
              </div>

              {/* Phase 1 Details */}
              <div className="p-4 border rounded-lg border-emerald-200 bg-emerald-50">
                <h4 className="mb-3 font-semibold text-emerald-800">
                  {t("home.progress.phase1.title")}
                </h4>
                <ul className="space-y-2 text-sm text-emerald-700">
                  <li className="flex items-start">
                    <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-emerald-600 flex-shrink-0" />
                    {t("home.progress.phase1.point1")}
                  </li>
                  <li className="flex items-start">
                    <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-emerald-600 flex-shrink-0" />
                    {t("home.progress.phase1.point2")}
                  </li>
                  <li className="flex items-start">
                    <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-emerald-600 flex-shrink-0" />
                    {t("home.progress.phase1.point3")}
                  </li>
                </ul>
              </div>

              {/* Phase 2 Details */}
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="mb-3 font-semibold text-blue-800">
                  {t("home.progress.phase2.title")}
                </h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start">
                    <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
                    {t("home.progress.phase2.point1")}
                  </li>
                  <li className="flex items-start">
                    <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
                    {t("home.progress.phase2.point2")}
                  </li>
                  <li className="flex items-start">
                    <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
                    {t("home.progress.phase2.point3")}
                  </li>
                </ul>
              </div>

              {/* Phase 3 Details */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="mb-3 font-semibold text-gray-600">
                  {t("home.progress.phase3.title")}
                </h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-start">
                    <div className="w-4 h-4 mt-0.5 mr-2 border border-gray-300 rounded flex-shrink-0"></div>
                    {t("home.progress.phase3.point1")}
                  </li>
                  <li className="flex items-start">
                    <div className="w-4 h-4 mt-0.5 mr-2 border border-gray-300 rounded flex-shrink-0"></div>
                    {t("home.progress.phase3.point2")}
                  </li>
                  <li className="flex items-start">
                    <div className="w-4 h-4 mt-0.5 mr-2 border border-gray-300 rounded flex-shrink-0"></div>
                    {t("home.progress.phase3.point3")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
