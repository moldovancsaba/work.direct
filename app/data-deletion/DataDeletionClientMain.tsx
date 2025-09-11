"use client"

import React from 'react'
import { HeroBlock, MainBlock } from '../components/play/Blocks'

export default function DataDeletionClientMain() {
  const title = 'User Data Deletion'
  const body = `To request deletion of your personal data used on PlayMass:\n\n1) In-App: If available, use your account/profile menu to submit a deletion request.\n2) By Email: Contact PlayMass or the game organizer with your name and (if known) your participant UUID.\n3) Processing: We will verify your request and delete associated data, subject to legal retention obligations.\n4) Scope: Deletion includes gameplay records and contact information stored for this service.\n5) Questions: Please refer to our Privacy Policy for additional details.\n`
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#000000FF', color: '#FFFFFFFF', fontFamily: '"Noto Sans", sans-serif' }}>
      <HeroBlock title={title} />
      <MainBlock>
        <div className="text-base" style={{ whiteSpace: 'pre-wrap' }}>
          {body}
        </div>
      </MainBlock>
    </div>
  )
}

