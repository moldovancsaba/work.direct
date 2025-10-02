// app/hooks/useAdminAuth.ts
// WHAT: Client-side admin auth hook for PlayMass.
// WHY: Mirrors MessMass behavior — checks server auth endpoint and redirects
//      unauthenticated users to /admin/login. Provides logout action.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '../lib/logger'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'super-admin'
  permissions: string[]
}

export function useAdminAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let aborted = false
    const controller = new AbortController()

    async function run() {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/auth', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal
        })
        if (!aborted) {
          if (res.ok) {
            const data = await res.json()
            setUser(data.user)
            setError(null)
          } else {
            setUser(null)
            router.push('/admin/login')
          }
        }
      } catch (err) {
        if (!aborted) {
          logger.error('Auth check failed', { error: err })
          setError('Authentication failed')
          setUser(null)
          router.push('/admin/login')
        }
      } finally {
        if (!aborted) setLoading(false)
      }
    }

    run()
    return () => {
      aborted = true
      controller.abort()
    }
  }, [router])

  const logout = async () => {
    try {
      await fetch('/api/admin/login', {
        method: 'DELETE',
        credentials: 'include'
      })
    } catch (err) {
      logger.error('Logout failed', { error: err })
    }
    setUser(null)
    router.push('/admin/login')
  }

  return { user, error, loading, logout, isAuthenticated: !!user }
}
