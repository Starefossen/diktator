'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Only redirect in browser environment, not during build
    if (typeof window !== 'undefined') {
      // In SPA mode, redirect all unknown routes to the home page
      // This allows client-side routing to handle the navigation
      router.replace('/')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Redirecting...</h1>
        <p className="text-gray-600">Taking you to the home page.</p>
      </div>
    </div>
  )
}
