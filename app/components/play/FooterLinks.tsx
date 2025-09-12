"use client"

import React from 'react'

export default function FooterLinks({ gameId }: { gameId: string }) {
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
      <span>•</span>
      <a href="#" onClick={onLogout} className="underline hover:no-underline">Logout</a>
    </div>
  )
}

