'use client'

import { useLanguage, Language } from '@/contexts/LanguageContext'

const flags = {
  en: {
    emoji: '��',
    colors: 'from-blue-500 via-white to-red-500',
    name: 'English'
  },
  no: {
    emoji: '🇳🇴',
    colors: 'from-red-500 via-white to-blue-600',
    name: 'Norsk'
  }
}

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex gap-2 mb-6">
      {(Object.keys(flags) as Language[]).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`
            relative overflow-hidden rounded-lg border-2 transition-all duration-200 hover:scale-105
            ${language === lang
              ? 'border-yellow-400 ring-2 ring-yellow-300 shadow-lg transform scale-105'
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <div className={`bg-gradient-to-r ${flags[lang].colors} p-3 relative`}>
            <div className="text-2xl mb-1">{flags[lang].emoji}</div>
            <div className="text-xs font-semibold text-gray-800 bg-white/80 px-2 py-1 rounded">
              {flags[lang].name}
            </div>
            {language === lang && (
              <div className="absolute inset-0 bg-yellow-200/20 animate-pulse"></div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
