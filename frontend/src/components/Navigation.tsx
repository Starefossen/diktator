'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import NavigationLanguageSwitcher from './NavigationLanguageSwitcher'

export function Navigation() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 shadow-sm bg-white/95 backdrop-blur-sm">
      <div className="max-w-6xl px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex items-center justify-center w-8 h-8 transition-transform duration-200 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 group-hover:scale-110">
              <span className="text-lg font-bold text-white">D</span>
            </div>
            <span className="text-xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              Diktator
            </span>
          </Link>

          {/* Navigation Links and Language Switcher */}
          <div className="flex items-center space-x-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === '/'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/practice/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname.startsWith('/practice')
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {t('nav.practice')}
            </Link>
            <Link
              href="/about/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname.startsWith('/about')
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {t('nav.about')}
            </Link>

            {/* Language Switcher */}
            <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
              <NavigationLanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
