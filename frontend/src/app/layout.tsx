import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { LanguageProvider } from '@/contexts/LanguageContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Diktator - Spelling Practice for Kids',
  description: 'A fun spelling practice app for children',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <LanguageProvider>
          <Navigation />
          <main>
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  )
}
