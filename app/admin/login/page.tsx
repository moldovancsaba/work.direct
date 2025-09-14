// app/admin/login/page.tsx
// WHAT: Simple admin login page for PlayMass.
// WHY: Provides password entry that posts to /api/admin/login and redirects on success.

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already authenticated, redirect to /admin
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/auth', { credentials: 'include', cache: 'no-store' })
        if (!mounted) return
        if (res.ok) router.replace('/admin')
      } catch (_err) {
        // stay on page
      }
    })()
    return () => { mounted = false }
  }, [router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/admin')
      } else {
        setError(data?.error || 'Invalid password')
      }
    } catch (_err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">PlayMass Admin</h1>
          <p className="text-gray-600 mt-2">Enter admin password to access the dashboard</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm p-3">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 rounded-lg text-white font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to PlayMass
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
