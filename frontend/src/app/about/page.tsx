"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          {t("about.title")}
        </h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              {t("about.what.title")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("about.what.desc")}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">
              {t("about.features.title")}
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                {t("about.feature.1")}
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                {t("about.feature.2")}
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                {t("about.feature.3")}
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                {t("about.feature.4")}
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                {t("about.feature.5")}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">
              {t("about.tech.title")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">
                  {t("about.tech.frontend")}
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Next.js 14 (SPA Mode)</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• React 18</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">
                  {t("about.tech.backend")}
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Go with Gin</li>
                  <li>• Google Cloud Run</li>
                  <li>• RESTful API</li>
                  <li>• Docker</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">
              {t("about.development.title")}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t("about.development.desc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
