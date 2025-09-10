import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GameResultClient from './GameResultClient'
import { resolvePlayConfig } from '../../../lib/resolvers/playConfigResolver'

// Fetch game data for metadata generation
// This runs on the server side for proper OpenGraph/Twitter meta tags
async function fetchGameData(gameId: string) {
  try {
    // Use the production URL if available, otherwise localhost for development
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/games/${gameId}`, {
      // Add cache headers to prevent stale data in production
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Failed to fetch game data for metadata:', error)
    return null
  }
}

// Generate dynamic metadata for better social sharing
// This creates contextual meta tags instead of generic platform descriptions
export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>
}): Promise<Metadata> {
  const { gameId } = await params
  const game = await fetchGameData(gameId)
  
  if (!game) {
    return {
      title: 'Game Not Found - PlayMass',
      description: 'This game could not be found. Try another game on PlayMass!',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const gameUrl = `${baseUrl}/play/${gameId}`
  
  // Create engaging share messages for social platforms
  const shareTitle = `I just finished "${game.title}"! Your turn!`
  const shareDescription = `Think you can find all the stars? Challenge yourself with this fun game on PlayMass!`
  
  return {
    title: shareTitle,
    description: shareDescription,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: gameUrl,
      siteName: 'PlayMass',
      title: shareTitle,
      description: shareDescription,
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(game.title)}&type=game`,
          width: 1200,
          height: 630,
          alt: `Play ${game.title} on PlayMass`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description: shareDescription,
      images: [`${baseUrl}/api/og?title=${encodeURIComponent(game.title)}&type=game`],
    },
  }
}

// Server component that renders the client component
// This allows us to have server-side metadata while keeping interactivity
export default async function GameResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { gameId } = await params
  const searchParamsData = await searchParams
  
  // Extract participant UUID from search parameters
  // This UUID comes from the game play URL when participants share their results
  const participantUuid = typeof searchParamsData?.participantUuid === 'string' 
    ? searchParamsData.participantUuid 
    : undefined
  
  // Pre-fetch game data on the server for faster initial load
  // The client component will also fetch this data for real-time updates
  const initialGameData = await fetchGameData(gameId)
  
  if (!initialGameData) {
    // Return not found if game doesn't exist
    notFound()
  }

  // For platformized result page
  const ResultClientPlatform = (await import('./ResultClientPlatform')).default
  const wonParam = typeof (await searchParams)?.won === 'string' ? ((await searchParams).won as string) : undefined
  const won = wonParam === 'true'
  
  return (
    <ResultClientPlatform
      gameId={gameId}
      texts={(await resolvePlayConfig(initialGameData as any)).platform?.texts || {}}
      styles={(await resolvePlayConfig(initialGameData as any)).platform?.styles || {}}
      won={won}
      refCode={(await resolvePlayConfig(initialGameData as any)).meta.ref}
    />
  )
}
