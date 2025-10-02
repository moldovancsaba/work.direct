// Centralized PlayMass defaults for play flow texts and colors
// What: Provide stable defaults per module to ensure UI resilience.
// Why: Resolver merges per-game config with these defaults to avoid undefined copy/colors.

export const PlaymassDefaults = {
  starsHexa: {
    welcome: {
      title: 'Welcome to Stars Hexa',
      subtitle: 'Find all the hidden stars to win!',
      ctaLabel: 'Start'
    },
    rules: {
      title: 'How to Play',
      items: [
        'Flip cards to find hidden stars',
        'You have limited flips per round',
        'Cards flip back after a short delay if not a win'
      ]
    },
    game: {
      component: 'StarsHexa',
      config: {}
    },
    result: {
      title: 'Great game!',
      subtitle: 'Thanks for playing',
      ctaLabel: 'Play Again'
    },
    colors: {
      palette: {
        primary: '#6C5CE7',
        accent: '#00CEC9',
        background: '#0F0F12',
        text: '#FFFFFF',
        buttonPrimary: '#6C5CE7',
        buttonText: '#FFFFFF'
      }
    }
  },
  penaltyShootout: {
    welcome: {
      title: 'Penalty Shootout',
      subtitle: 'Select 5 players and beat the opponent',
      ctaLabel: 'Start'
    },
    rules: {
      title: 'Game Rules',
      items: [
        'Select 5 players for penalties',
        'Opponent scores randomly',
        'If draw → sudden death'
      ]
    },
    game: {
      component: 'PenaltyShootout',
      config: {}
    },
    result: {
      title: 'Game Results',
      subtitle: '',
      ctaLabel: 'Play Again'
    },
    colors: {
      palette: {
        primary: '#c00000',
        accent: '#0066cc',
        background: '#228B22',
        text: '#FFFFFF',
        buttonPrimary: '#22C55E',
        buttonText: '#FFFFFF'
      }
    }
  }
} as const

