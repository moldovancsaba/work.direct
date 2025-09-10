// app/lib/auth.ts
// WHAT: Minimal admin authentication utilities for PlayMass.
// WHY: Mirrors MessMass' simple password + cookie approach for MVP parity.
//      Uses a base64-encoded JSON token in an httpOnly cookie ('admin-session').
//      Not cryptographically signed — suitable for MVP only; see docs for future hardening.

import { cookies } from 'next/headers'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'super-admin'
  permissions: string[]
}

// Static admin user for MVP
const ADMIN_USER: AdminUser = {
  id: 'admin',
  name: 'PlayMass Administrator',
  email: 'admin@playmass.local',
  role: 'super-admin',
  permissions: ['read', 'write', 'delete', 'manage-users', 'admin-access']
}

function isValidAdminSession(sessionToken: string): boolean {
  // WHAT: Decode base64 JSON token; verify expiration and fixed user role.
  // WHY: Keeps validation lightweight and server-only (httpOnly cookie).
  try {
    const tokenData = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
    const expiresAt = new Date(tokenData.expiresAt)
    const now = new Date()
    return (
      now <= expiresAt &&
      tokenData.userId === 'admin' &&
      tokenData.role === 'super-admin'
    )
  } catch (_error) {
    return false
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  if (!adminSession || !isValidAdminSession(adminSession.value)) {
    return null
  }
  return ADMIN_USER
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getAdminUser()
  return user !== null
}

export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getAdminUser()
  return user?.role === 'super-admin' || user?.permissions.includes(permission) || false
}

export async function logoutAdmin(): Promise<string> {
  // WHAT: Client-triggered logout via API; clears cookie server-side.
  // WHY: Keeps cookie handling on server for security; returns redirect path.
  try {
    await fetch('/api/admin/login', { method: 'DELETE', credentials: 'include' })
  } catch (_error) {
    // no-op
  }
  return '/admin/login'
}

