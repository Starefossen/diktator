"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Icons,
  HeroRocketIcon,
  HeroBookIcon,
  HeroCheckIcon,
  HeroVolumeIcon,
} from "@/components/Icons";

export default function HomePage() {
  const { t } = useLanguage();
  const { user, loading, needsRegistration, hasPendingInvites } = useAuth();
  const router = useRouter();

  // Redirect authenticated users based on their registration status
  useEffect(() => {
    if (!loading && user) {
      if (needsRegistration || hasPendingInvites) {
        router.push("/register/");
      } else {
        router.push("/wordsets/");
      }
    }
  }, [user, loading, needsRegistration, hasPendingInvites, router]);

  // Show loading or nothing while redirecting authenticated users
  if (loading || user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-nordic-birch">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-nordic-sky/10 to-nordic-teal/10"></div>
        <div className="relative py-16 text-center">
          <div className="mb-6">
            <h1 className="mb-4 text-5xl font-bold text-transparent md:text-6xl bg-linear-to-r from-nordic-sky to-nordic-teal bg-clip-text">
              {t("home.welcome")}
            </h1>
            <div className="w-24 h-1 mx-auto rounded-full bg-linear-to-r from-nordic-sky to-nordic-teal"></div>
          </div>
          <p className="max-w-2xl mx-auto mb-8 text-xl text-gray-700 md:text-2xl">
            {t("home.subtitle")}
          </p>
        </div>
      </div>

      {/* Main Cards */}
      <div className="px-4 pb-16">
        {/* Features Showcase Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-transparent md:text-4xl bg-linear-to-r from-nordic-sky to-nordic-teal bg-clip-text">
              {t("home.features.title")}
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              {t("home.features.subtitle")}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-6 mb-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative p-6 overflow-hidden transition-shadow bg-white shadow-md rounded-xl hover:shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 translate-x-8 -translate-y-8 rounded-full bg-linear-to-br from-nordic-sky/20 to-nordic-sky/40"></div>
              <div className="relative">
                <div className="mb-4">
                  <HeroVolumeIcon className="w-10 h-10 text-nordic-sky" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {t("home.features.tts")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("home.features.tts.desc")}
                </p>
              </div>
            </div>

            <div className="relative p-6 overflow-hidden transition-shadow bg-white shadow-md rounded-xl hover:shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 translate-x-8 -translate-y-8 rounded-full bg-linear-to-br from-nordic-sunrise/20 to-nordic-sunrise/40"></div>
              <div className="relative">
                <div className="mb-4">
                  <Icons.trophy className="w-10 h-10 text-nordic-sunrise" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {t("home.features.results")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("home.features.results.desc")}
                </p>
              </div>
            </div>

            <div className="relative p-6 overflow-hidden transition-shadow bg-white shadow-md rounded-xl hover:shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 translate-x-8 -translate-y-8 rounded-full bg-linear-to-br from-nordic-meadow/20 to-nordic-meadow/40"></div>
              <div className="relative">
                <div className="mb-4">
                  <Icons.user className="w-10 h-10 text-nordic-meadow" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {t("home.features.profiles")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("home.features.profiles.desc")}
                </p>
              </div>
            </div>

            <div className="relative p-6 overflow-hidden transition-shadow bg-white shadow-md rounded-xl hover:shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 translate-x-8 -translate-y-8 rounded-full bg-linear-to-br from-nordic-teal/20 to-nordic-teal/40"></div>
              <div className="relative">
                <div className="mb-4">
                  <Icons.sparkles className="w-10 h-10 text-nordic-teal" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {t("home.features.i18n")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("home.features.i18n.desc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Demo Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="p-8 bg-linear-to-br from-nordic-sky/10 to-nordic-teal/10 rounded-3xl lg:p-12">
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                {t("home.demo.title")}
              </h2>
              <p className="text-lg text-gray-600">{t("home.demo.subtitle")}</p>
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center shrink-0 w-8 h-8 font-bold text-nordic-midnight bg-nordic-sky rounded-full">
                    1
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900">
                      {t("home.demo.step1.title")}
                    </h3>
                    <p className="text-gray-600">{t("home.demo.step1.desc")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center shrink-0 w-8 h-8 font-bold text-nordic-midnight bg-nordic-meadow rounded-full">
                    2
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900">
                      {t("home.demo.step2.title")}
                    </h3>
                    <p className="text-gray-600">{t("home.demo.step2.desc")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center shrink-0 w-8 h-8 font-bold text-nordic-midnight bg-nordic-teal rounded-full">
                    3
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-900">
                      {t("home.demo.step3.title")}
                    </h3>
                    <p className="text-gray-600">{t("home.demo.step3.desc")}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white shadow-lg rounded-2xl">
                <div className="p-8 text-center border-2 border-gray-200 border-dashed rounded-xl">
                  <HeroBookIcon className="w-16 h-16 mx-auto mb-4 text-nordic-midnight" />
                  <h4 className="mb-2 font-semibold text-gray-900">
                    {t("home.demo.cta.title")}
                  </h4>
                  <p className="mb-4 text-gray-600">
                    {t("home.demo.cta.desc")}
                  </p>
                  {!user && (
                    <Link
                      href="/auth/"
                      className="inline-flex items-center px-4 py-2 text-nordic-midnight transition-colors bg-nordic-sky rounded-lg hover:bg-nordic-sky/90"
                    >
                      {t("home.demo.cta.button")}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits for Different Users */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              {t("home.benefits.title")}
            </h2>
            <p className="text-lg text-gray-600">
              {t("home.benefits.subtitle")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* For Parents */}
            <div className="p-8 bg-linear-to-br from-nordic-sky/10 to-nordic-sky/20 rounded-2xl">
              <div className="mb-6">
                <Icons.user className="w-12 h-12 text-nordic-sky" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-nordic-midnight">
                {t("home.benefits.parents.title")}
              </h3>
              <ul className="space-y-3 text-nordic-midnight">
                <li className="flex items-start">
                  <HeroCheckIcon className="w-5 h-5 text-nordic-sky mr-2 mt-0.5" />
                  {t("home.benefits.parents.1")}
                </li>
                <li className="flex items-start">
                  <HeroCheckIcon className="w-5 h-5 text-nordic-sky mr-2 mt-0.5" />
                  {t("home.benefits.parents.2")}
                </li>
                <li className="flex items-start">
                  <HeroCheckIcon className="w-5 h-5 text-nordic-sky mr-2 mt-0.5" />
                  {t("home.benefits.parents.3")}
                </li>
              </ul>
            </div>

            {/* For Children */}
            <div className="p-8 bg-linear-to-br from-nordic-meadow/10 to-nordic-meadow/20 rounded-2xl">
              <div className="mb-6">
                <HeroRocketIcon className="w-12 h-12 text-nordic-meadow" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-nordic-midnight">
                {t("home.benefits.children.title")}
              </h3>
              <ul className="space-y-3 text-nordic-midnight">
                <li className="flex items-start">
                  <HeroCheckIcon className="w-5 h-5 text-nordic-meadow mr-2 mt-0.5" />
                  {t("home.benefits.children.1")}
                </li>
                <li className="flex items-start">
                  <HeroCheckIcon className="w-5 h-5 text-nordic-meadow mr-2 mt-0.5" />
                  {t("home.benefits.children.2")}
                </li>
                <li className="flex items-start">
                  <HeroCheckIcon className="w-5 h-5 text-nordic-meadow mr-2 mt-0.5" />
                  {t("home.benefits.children.3")}
                </li>
              </ul>
            </div>

            {/* For Families */}
            <div className="p-8 bg-linear-to-br from-nordic-teal/10 to-nordic-teal/20 rounded-2xl">
              <div className="mb-6">
                <Icons.user className="w-12 h-12 text-nordic-teal" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-nordic-midnight">
                {t("home.benefits.family.title")}
              </h3>
              <ul className="space-y-3 text-nordic-midnight">
                <li className="flex items-start">
                  <HeroCheckIcon className="w-5 h-5 text-nordic-teal mr-2 mt-0.5" />
                  {t("home.benefits.family.1")}
                </li>
                <li className="flex items-start">
                  <HeroCheckIcon className="w-5 h-5 text-nordic-teal mr-2 mt-0.5" />
                  {t("home.benefits.family.2")}
                </li>
                <li className="flex items-start">
                  <HeroCheckIcon className="w-5 h-5 text-nordic-teal mr-2 mt-0.5" />
                  {t("home.benefits.family.3")}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* PWA Installation Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="p-8 text-center text-nordic-midnight bg-linear-to-r from-nordic-sky to-nordic-teal rounded-3xl lg:p-12">
            <div className="mb-6">
              <Icons.home className="w-16 h-16 mx-auto mb-4 text-white" />
              <h2 className="mb-4 text-3xl font-bold">{t("home.pwa.title")}</h2>
              <p className="mb-6 text-xl text-nordic-midnight/80">
                {t("home.pwa.subtitle")}
              </p>
            </div>

            <div className="grid gap-6 mb-8 md:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-white rounded-full">
                  <Icons.clock className="w-6 h-6 text-nordic-midnight" />
                </div>
                <h3 className="mb-2 font-semibold">
                  {t("home.pwa.feature1.title")}
                </h3>
                <p className="text-sm text-nordic-midnight/80">
                  {t("home.pwa.feature1.desc")}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-white rounded-full">
                  <Icons.zap className="w-6 h-6 text-nordic-sunrise" />
                </div>
                <h3 className="mb-2 font-semibold">
                  {t("home.pwa.feature2.title")}
                </h3>
                <p className="text-sm text-nordic-midnight/80">
                  {t("home.pwa.feature2.desc")}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-white rounded-full">
                  <Icons.sparkles className="w-6 h-6 text-nordic-teal" />
                </div>
                <h3 className="mb-2 font-semibold">
                  {t("home.pwa.feature3.title")}
                </h3>
                <p className="text-sm text-nordic-midnight/80">
                  {t("home.pwa.feature3.desc")}
                </p>
              </div>
            </div>

            <div className="text-sm text-nordic-midnight/80">
              {t("home.pwa.footer")}
            </div>
          </div>
        </div>

        <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-2">
          {/* Start Learning Card */}
          <div className="relative overflow-hidden transition-all duration-300 transform bg-white shadow-lg group rounded-2xl hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 translate-x-16 -translate-y-16 rounded-full bg-linear-to-br from-nordic-sky/20 to-nordic-sky/40"></div>
            <div className="relative p-8">
              <div className="mb-4">
                <HeroRocketIcon className="w-12 h-12 text-nordic-sky" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                {user ? t("home.wordsets.title") : t("home.start.title")}
              </h2>
              <p className="mb-6 leading-relaxed text-gray-600">
                {user ? t("home.wordsets.desc") : t("home.start.desc")}
              </p>

              {/* Feature highlights */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mr-2 text-nordic-meadow" />
                  {t("home.start.feature1")}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mr-2 text-nordic-meadow" />
                  {t("home.start.feature2")}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mr-2 text-nordic-meadow" />
                  {t("home.start.feature3")}
                </div>
              </div>

              {user ? (
                <Link
                  href="/wordsets/"
                  className="inline-flex items-center px-6 py-3 font-semibold text-nordic-midnight transition-all duration-200 shadow-md bg-linear-to-r from-nordic-sky to-nordic-teal rounded-xl hover:from-nordic-sky/90 hover:to-nordic-teal/90 hover:shadow-lg group"
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
                <div className="space-y-3">
                  <Link
                    href="/auth/"
                    className="inline-flex items-center justify-center w-full px-6 py-3 font-semibold text-nordic-midnight transition-all duration-200 shadow-md bg-linear-to-r from-nordic-sky to-nordic-teal rounded-xl hover:from-nordic-sky/90 hover:to-nordic-teal/90 hover:shadow-lg group"
                  >
                    {t("home.start.button")}
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
              )}
            </div>
          </div>

          {/* Learn More Card */}
          <div className="relative overflow-hidden transition-all duration-300 transform bg-white shadow-lg group rounded-2xl hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 translate-x-16 -translate-y-16 rounded-full bg-linear-to-br from-nordic-meadow/20 to-nordic-meadow/40"></div>
            <div className="relative p-8">
              <div className="mb-4">
                <HeroBookIcon className="w-12 h-12 text-nordic-meadow" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                {t("home.about.title")}
              </h2>
              <p className="mb-6 leading-relaxed text-gray-600">
                {t("home.about.desc")}
              </p>

              {/* Technology highlights */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mr-2 text-nordic-meadow" />
                  {t("home.about.tech1")}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mr-2 text-nordic-meadow" />
                  {t("home.about.tech2")}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mr-2 text-nordic-meadow" />
                  {t("home.about.tech3")}
                </div>
              </div>

              <Link
                href="/about/"
                className="inline-flex items-center px-6 py-3 font-semibold text-nordic-midnight transition-all duration-200 shadow-md bg-linear-to-r from-nordic-meadow to-nordic-teal rounded-xl hover:from-nordic-meadow/90 hover:to-nordic-teal/90 hover:shadow-lg group"
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

      {/* Final CTA Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl px-4 mx-auto text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            {t("home.cta.title")}
          </h2>
          <p className="mb-8 text-xl text-gray-600">{t("home.cta.subtitle")}</p>

          {!user ? (
            <div className="space-y-4">
              <Link
                href="/auth/"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-nordic-midnight transition-all duration-200 transform shadow-lg bg-linear-to-r from-nordic-sky to-nordic-teal rounded-xl hover:from-nordic-sky/90 hover:to-nordic-teal/90 hover:shadow-xl hover:-translate-y-1"
              >
                {t("home.cta.button")}
                <HeroRocketIcon className="w-5 h-5 ml-2" />
              </Link>
              <p className="text-sm text-gray-500">{t("home.cta.footer")}</p>
            </div>
          ) : (
            <Link
              href="/wordsets/"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-nordic-midnight transition-all duration-200 transform shadow-lg bg-linear-to-r from-nordic-sky to-nordic-teal rounded-xl hover:from-nordic-sky/90 hover:to-nordic-teal/90 hover:shadow-xl hover:-translate-y-1"
            >
              {t("home.cta.continue")}
              <HeroRocketIcon className="w-5 h-5 ml-2" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
