'use client'

import Link from 'next/link'
import { useApiStatus } from '@/hooks/useApiStatus'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HomePage() {
  const { status, message } = useApiStatus()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20"></div>
        <div className="relative py-16 text-center">
          <div className="mb-6">
            <h1 className="mb-4 text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.welcome')}
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          <p className="mb-8 text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>

          {/* API Status Indicator */}
          <div className="mb-12">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm ${status === 'connected'
              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
              : status === 'error'
                ? 'bg-red-100 text-red-800 ring-1 ring-red-200'
                : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
              }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${status === 'connected' ? 'bg-emerald-500' :
                status === 'error' ? 'bg-red-500' : 'bg-amber-500'
                }`}></span>
              {status === 'loading' ? t('home.api.checking') :
                status === 'connected' ? t('home.api.connected') : t('home.api.disconnected')}
            </div>
          </div>
        </div>
      </div>

      {/* Main Cards */}
      <div className="px-4 pb-16">
        <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-2">
          {/* Practice Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative p-8">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Start Practicing!</h2>
              <p className="mb-6 text-gray-600 leading-relaxed">
                {t('home.practice.desc')}
              </p>
              <Link
                href="/practice/"
                className="inline-flex items-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg group"
              >
                {t('home.practice.button')}
                <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* About Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative p-8">
              <div className="text-4xl mb-4">📚</div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">{t('home.about.title')}</h2>
              <p className="mb-6 text-gray-600 leading-relaxed">
                {t('home.about.desc')}
              </p>
              <Link
                href="/about/"
                className="inline-flex items-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg group"
              >
                {t('home.about.button')}
                <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Phase 0 Complete! ✅</h2>
              <p className="text-gray-600">
                Single Page Application structure is set up and ready for development.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="mr-3 text-emerald-500 text-xl">✅</span>
                  <span className="text-gray-700 font-medium">Next.js 14 SPA Mode</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3 text-emerald-500 text-xl">✅</span>
                  <span className="text-gray-700 font-medium">TypeScript</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3 text-emerald-500 text-xl">✅</span>
                  <span className="text-gray-700 font-medium">Tailwind CSS</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="mr-3 text-emerald-500 text-xl">✅</span>
                  <span className="text-gray-700 font-medium">Go API Backend</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3 text-emerald-500 text-xl">✅</span>
                  <span className="text-gray-700 font-medium">Client-side Routing</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3 text-emerald-500 text-xl">✅</span>
                  <span className="text-gray-700 font-medium">GitHub Actions</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <p className="text-gray-800 font-medium text-center">
                🚀 <strong>Development:</strong> Run <code className="mx-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-mono text-sm">mise run dev</code> to start both frontend and backend!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
