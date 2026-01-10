"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  HeroCheckIcon,
  HeroRocketIcon,
  HeroBookIcon,
  HeroVolumeIcon,
} from "@/components/Icons";

export default function AboutPage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid SSR/static generation
  }

  return (
    <div className="min-h-screen py-12 bg-nordic-birch">
      <div className="max-w-4xl px-4 mx-auto">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-transparent md:text-5xl bg-linear-to-r from-nordic-sky to-nordic-teal bg-clip-text">
            {t("about.title")}
          </h1>
          <div className="w-24 h-1 mx-auto rounded-full bg-linear-to-r from-nordic-sky to-nordic-teal"></div>
        </div>

        {/* What is Diktator */}
        <div className="p-8 mb-8 bg-white shadow-lg rounded-2xl">
          <h2 className="flex items-center mb-6 text-2xl font-bold text-gray-900">
            <HeroBookIcon className="w-8 h-8 mr-3 text-nordic-sky" />
            {t("about.what.title")}
          </h2>
          <p className="text-lg leading-relaxed text-gray-700">
            {t("about.what.desc")}
          </p>
        </div>

        {/* Key Features Grid */}
        <div className="mb-8">
          <h2 className="mb-8 text-3xl font-bold text-center text-gray-900">
            {t("about.features.title")}
          </h2>

          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            {/* Interactive Learning */}
            <div className="p-6 bg-white shadow-md rounded-xl">
              <div className="mb-4">
                <HeroRocketIcon className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                {t("about.features.interactiveLearning")}
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-emerald-500 shrink-0" />
                  {t("about.feature.1")}
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-emerald-500 shrink-0" />
                  {t("about.feature.3")}
                </li>
              </ul>
            </div>

            {/* Audio Experience */}
            <div className="p-6 bg-white shadow-md rounded-xl">
              <div className="mb-4">
                <HeroVolumeIcon className="w-10 h-10 text-nordic-sky" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                {t("about.features.audioExperience")}
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-nordic-sky shrink-0" />
                  {t("about.feature.2")}
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-nordic-sky shrink-0" />
                  {t("about.feature.6")}
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-nordic-sky shrink-0" />
                  {t("about.feature.9")}
                </li>
              </ul>
            </div>

            {/* Modern Design */}
            <div className="p-6 bg-white shadow-md rounded-xl">
              <div className="mb-4">
                <HeroCheckIcon className="w-10 h-10 text-nordic-teal" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                {t("about.features.modernDesign")}
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-nordic-teal shrink-0" />
                  {t("about.feature.4")}
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-nordic-teal shrink-0" />
                  {t("about.feature.7")}
                </li>
                <li className="flex items-start text-sm text-gray-600">
                  <HeroCheckIcon className="w-4 h-4 mt-0.5 mr-2 text-nordic-teal shrink-0" />
                  {t("about.feature.8")}
                </li>
              </ul>
            </div>
          </div>

          {/* Additional Features */}
          <div className="p-6 bg-nordic-sky/10 rounded-xl">
            <h3 className="mb-4 text-lg font-semibold text-center text-gray-900">
              {t("about.features.additional")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center">
                <HeroCheckIcon className="w-5 h-5 mr-3 text-emerald-500" />
                <span className="text-gray-700">{t("about.feature.5")}</span>
              </div>
              <div className="flex items-center">
                <HeroCheckIcon className="w-5 h-5 mr-3 text-emerald-500" />
                <span className="text-gray-700">{t("about.feature.10")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="p-8 mb-8 bg-white shadow-lg rounded-2xl">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            {t("about.tech.title")}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="p-6 rounded-xl bg-nordic-sky/10">
              <h3 className="mb-4 text-lg font-semibold text-nordic-midnight">
                {t("about.tech.frontend")}
              </h3>
              <ul className="space-y-2 text-sm text-nordic-midnight">
                <li className="flex items-center">
                  <HeroCheckIcon className="w-4 h-4 mr-2" />
                  {t("about.tech.nextjs")}
                </li>
                <li className="flex items-center">
                  <HeroCheckIcon className="w-4 h-4 mr-2" />
                  {t("about.tech.typescript")}
                </li>
                <li className="flex items-center">
                  <HeroCheckIcon className="w-4 h-4 mr-2" />
                  {t("about.tech.tailwind")}
                </li>
                <li className="flex items-center">
                  <HeroCheckIcon className="w-4 h-4 mr-2" />
                  {t("about.tech.react")}
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-xl bg-nordic-meadow/10">
              <h3 className="mb-4 text-lg font-semibold text-nordic-midnight">
                {t("about.tech.backend")}
              </h3>
              <ul className="space-y-2 text-sm text-nordic-midnight">
                <li className="flex items-center">
                  <HeroCheckIcon className="w-4 h-4 mr-2" />
                  {t("about.tech.go")}
                </li>
                <li className="flex items-center">
                  <HeroCheckIcon className="w-4 h-4 mr-2" />
                  {t("about.tech.knative")}
                </li>
                <li className="flex items-center">
                  <HeroCheckIcon className="w-4 h-4 mr-2" />
                  {t("about.tech.restful")}
                </li>
                <li className="flex items-center">
                  <HeroCheckIcon className="w-4 h-4 mr-2" />
                  {t("about.tech.docker")}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Development */}
        <div className="p-8 bg-white shadow-lg rounded-2xl">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            {t("about.development.title")}
          </h2>
          <p className="text-lg leading-relaxed text-gray-700">
            {t("about.development.desc")}
          </p>
        </div>
      </div>
    </div>
  );
}
