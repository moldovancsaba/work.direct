"use client"

import React from 'react'
import { HeroBlock, MainBlock } from '../components/play/Blocks'

export default function TermsClientMain() {
  const title = 'General Terms & Conditions'
  const body = `Welcome to PlayMass. By using this website and our services, you agree to the following terms:\n\n1) Eligibility — You must comply with applicable laws and age requirements.\n2) Fair Use — Abuse, security violations, or unauthorized access are prohibited.\n3) Content — We may modify features without notice; availability is not guaranteed.\n4) Liability — Provided “as is”; we are not liable for indirect or consequential damages.\n5) Changes — We may update these Terms; continued use constitutes acceptance.\n6) Contact — For support, contact PlayMass.\n`
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

