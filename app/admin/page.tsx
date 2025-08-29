'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Admin main page redirects to games management
// This ensures /admin goes directly to the primary admin function
export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to games management page immediately
    router.replace('/admin/games')
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Games Management...</p>
      </div>
    </div>
  )
}
