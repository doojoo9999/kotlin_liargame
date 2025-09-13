// Type conversion utilities between frontend and backend representations
import type {BackendPlayer, GameStateResponse, ScoreboardEntry} from '@/types/backendTypes'
import type {FrontendGameState, FrontendPlayer} from '@/types'

/**
 * Converts backend player data to frontend player format
 */
export function convertBackendPlayer(backendPlayer: BackendPlayer, isHost = false): FrontendPlayer {
  return {
    id: backendPlayer.userId.toString(), // Convert number to string for frontend
    userId: backendPlayer.userId,
    nickname: backendPlayer.nickname,
    role: backendPlayer.id % 2 === 0 ? 'CITIZEN' : 'LIAR', // Temporary logic - replace with actual role
    isAlive: backendPlayer.isAlive,
    isHost,
    isOnline: true, // Default to online - update with real connection status
    state: backendPlayer.state,
    hint: backendPlayer.hint,
    defense: backendPlayer.defense,
    votesReceived: backendPlayer.votesReceived,
    hasVoted: backendPlayer.hasVoted,
    lastActive: Date.now()
  }
}

/**
 * Converts backend game state to frontend game state format
 */
export function convertBackendGameState(backendState: GameStateResponse): FrontendGameState {
  const frontendPlayers = backendState.players.map(player => 
    convertBackendPlayer(player, player.nickname === backendState.gameOwner)
  )

  return {
    gameId: backendState.gameNumber.toString(),
    gameNumber: backendState.gameNumber,
    phase: backendState.currentPhase,
    state: backendState.gameState,
    currentRound: backendState.gameCurrentRound,
    totalRounds: backendState.gameTotalRounds,
    timeRemaining: 0, // Calculate from phaseEndTime if available
    currentPlayer: backendState.turnOrder?.[backendState.currentTurnIndex],
    currentTurnIndex: backendState.currentTurnIndex,
    players: frontendPlayers,
    gameData: {
      topic: backendState.citizenSubject || backendState.liarSubject || 'Unknown',
      secretWord: backendState.yourWord,
      hints: [], // Convert from player hints
      votes: [], // Convert from voting data
      accusedPlayer: backendState.accusedPlayer?.toString(),
      defenseStatement: undefined,
      survivalVotes: undefined,
      guessAttempt: undefined,
      eliminatedPlayer: undefined,
      results: backendState.winner ? {
        winners: [backendState.winner],
        reason: backendState.reason || 'Game completed'
      } : undefined,
      victoryAchieved: !!backendState.winner,
      turnOrder: backendState.turnOrder,
      phaseEndTime: backendState.phaseEndTime
    },
    scores: convertScoreboardToRecord(backendState.scoreboard),
    gameMode: backendState.gameMode,
    isChatAvailable: backendState.isChatAvailable,
    winner: backendState.winner,
    reason: backendState.reason
  }
}

/**
 * Converts scoreboard entries to a record format
 */
export function convertScoreboardToRecord(scoreboard: ScoreboardEntry[]): Record<string, number> {
  const scores: Record<string, number> = {}
  scoreboard.forEach(entry => {
    scores[entry.userId.toString()] = entry.score
  })
  return scores
}

/**
 * Converts frontend player ID to backend format
 */
export function frontendToBackendPlayerId(frontendId: string): number {
  const id = parseInt(frontendId, 10)
  if (isNaN(id)) {
    throw new Error(`Invalid frontend player ID: ${frontendId}`)
  }
  return id
}

/**
 * Converts frontend game ID to backend format
 */
export function frontendToBackendGameId(frontendId: string): number {
  const id = parseInt(frontendId, 10)
  if (isNaN(id)) {
    throw new Error(`Invalid frontend game ID: ${frontendId}`)
  }
  return id
}

/**
 * Calculates time remaining from phase end time
 */
export function calculateTimeRemaining(phaseEndTime?: string): number {
  if (!phaseEndTime) return 0
  
  try {
    const endTime = new Date(phaseEndTime).getTime()
    const now = Date.now()
    const remaining = Math.max(0, endTime - now)
    return Math.floor(remaining / 1000) // Return seconds
  } catch (error) {
    console.warn('Error calculating time remaining:', error)
    return 0
  }
}

/**
 * Validates that a frontend player ID can be converted to backend format
 */
export function isValidFrontendPlayerId(id: string): boolean {
  const numId = parseInt(id, 10)
  return !isNaN(numId) && numId > 0
}

/**
 * Validates that a frontend game ID can be converted to backend format
 */
export function isValidFrontendGameId(id: string): boolean {
  const numId = parseInt(id, 10)
  return !isNaN(numId) && numId > 0
}

/**
 * Type converter object for use in services
 */
export const typeConverter = {
  backendToFrontend: {
    player: convertBackendPlayer,
    gameState: convertBackendGameState,
    scoreboard: convertScoreboardToRecord
  },
  frontendToBackend: {
    playerId: frontendToBackendPlayerId,
    gameId: frontendToBackendGameId
  },
  utils: {
    calculateTimeRemaining,
    isValidFrontendPlayerId,
    isValidFrontendGameId
  }
} as const