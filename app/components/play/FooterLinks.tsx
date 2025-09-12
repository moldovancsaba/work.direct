"use client"

import React, { useEffect, useState } from 'react'

export default function FooterLinks({ gameId }: { gameId: string }) {
  // Track if an end-user session exists (httpOnly cookie), so we only show Logout when relevant
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
        if (!cancelled) setHasSession(res.ok)
      } catch {
        if (!cancelled) setHasSession(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const onLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      // Redirect to home after logout to clear any state and show public view
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    }
  }

  return (
    <div className="mt-8 text-sm opacity-90 flex items-center justify-center gap-4">
      <a href={`/play/${gameId}/terms`} className="underline hover:no-underline">General Terms & Conditions</a>
      <span>•</span>
      <a href={`/play/${gameId}/privacy`} className="underline hover:no-underline">Privacy Policy</a>
      <span>•</span>
      <a href={`/play/${gameId}/deletion`} className="underline hover:no-underline">Data Deletion</a>
      {hasSession && (
        <>
          <span>•</span>
          <a href="#" onClick={onLogout} className="underline hover:no-underline">Logout</a>
        </>
      )}
    </div>
  )
}

