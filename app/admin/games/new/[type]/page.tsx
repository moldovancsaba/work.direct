'use client'

import { useParams } from 'next/navigation'
import GameEditor from '../../../../components/admin/GameEditor'
import { GameType } from '../../../../types'

export default function NewGameByTypePage() {
  const params = useParams()
  const type = (params as any)?.type as GameType
  return <GameEditor mode="create" initialGameType={type} hideTypeSelect={true} />
}

