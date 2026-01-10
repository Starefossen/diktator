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
  HeroUsersIcon,
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
      <div className="relative bg-nordic-midnight">
        <div className="relative py-16 text-center">
          <div className="mb-6">
            <h1 className="mb-4 text-5xl font-bold text-transparent md:text-6xl bg-linear-to-r from-nordic-sky to-nordic-teal bg-clip-text">
              {t("home.welcome")}
            </h1>
            <div className="w-24 h-1 mx-auto rounded-full bg-linear-to-r from-nordic-sky to-nordic-teal"></div>
          </div>
          <p className="max-w-2xl mx-auto mb-8 text-xl text-gray-300 md:text-2xl">
            {t("home.subtitle")}
          </p>
        </div>
        {/* Wave divider */}
        <div className="w-full overflow-hidden leading-none">
          <svg
            className="relative block w-full h-16 md:h-24"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C300,100 900,20 1200,80 L1200,120 L0,120 Z"
              fill="#FEFCE8"
            />
          </svg>
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
                <HeroUsersIcon className="w-12 h-12 text-nordic-teal" />
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

        {/* Combined PWA + CTA Section */}
        <div className="max-w-5xl mx-auto">
          <div className="p-8 text-white bg-linear-to-r from-nordic-sky to-nordic-teal rounded-3xl lg:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              {/* PWA Features */}
              <div>
                <div className="flex items-center mb-4">
                  <Icons.home className="w-10 h-10 mr-3" />
                  <h2 className="text-2xl font-bold lg:text-3xl">
                    {t("home.pwa.title")}
                  </h2>
                </div>
                <p className="mb-6 text-white/90">{t("home.pwa.subtitle")}</p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-white/20 rounded-full">
                      <Icons.clock className="w-5 h-5" />
                    </div>
                    <p className="text-xs">{t("home.pwa.feature1.title")}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-white/20 rounded-full">
                      <Icons.zap className="w-5 h-5" />
                    </div>
                    <p className="text-xs">{t("home.pwa.feature2.title")}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-white/20 rounded-full">
                      <Icons.sparkles className="w-5 h-5" />
                    </div>
                    <p className="text-xs">{t("home.pwa.feature3.title")}</p>
                  </div>
                </div>

                <p className="text-xs text-white/70">{t("home.pwa.footer")}</p>
              </div>

              {/* CTA */}
              <div className="p-6 text-center bg-white rounded-2xl lg:p-8">
                <h3 className="mb-2 text-xl font-bold text-gray-900 lg:text-2xl">
                  {t("home.cta.title")}
                </h3>
                <p className="mb-6 text-gray-600">{t("home.cta.subtitle")}</p>

                {!user ? (
                  <div className="space-y-3">
                    <Link
                      href="/auth/"
                      className="inline-flex items-center justify-center w-full px-6 py-4 text-lg font-semibold text-white transition-all duration-200 shadow-lg bg-nordic-midnight rounded-xl hover:bg-nordic-midnight/90"
                    >
                      {t("home.cta.button")}
                      <HeroRocketIcon className="w-5 h-5 ml-2 text-white" />
                    </Link>
                    <p className="text-xs text-gray-500">
                      {t("home.cta.footer")}
                    </p>
                  </div>
                ) : (
                  <Link
                    href="/wordsets/"
                    className="inline-flex items-center justify-center w-full px-6 py-4 text-lg font-semibold text-white transition-all duration-200 shadow-lg bg-nordic-midnight rounded-xl hover:bg-nordic-midnight/90"
                  >
                    {t("home.cta.continue")}
                    <HeroRocketIcon className="w-5 h-5 ml-2 text-white" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
