"use client"

import React from 'react'
import { HeroBlock, MainBlock } from '../components/play/Blocks'

export default function PrivacyClientMain() {
  const title = 'Privacy Policy'
  const body = `This Privacy Policy describes how PlayMass collects and processes personal data on this website:\n\n1) Data — Contact details and usage information to operate and improve the service.\n2) Purpose — Provide features, security, and aggregate analytics; no unauthorized sale of data.\n3) Retention — Kept only as long as necessary for the stated purposes.\n4) Security — Technical and organizational measures to protect data.\n5) Rights — Access, rectification, deletion, and objection where applicable.\n6) Contact — For privacy inquiries, contact PlayMass.\n`
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#000000FF', fontFamily: '"Noto Sans", sans-serif' }}>
      <HeroBlock title={title} useScoreboard={false} />
      <MainBlock>
        <div className="text-base" style={{ whiteSpace: 'pre-wrap' }}>
          {body}
        </div>
      </MainBlock>
    </div>
  )
}

