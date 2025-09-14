/**
 * Game Initialization Service
 * Handles proper initialization of game state from backend data
 * Replaces all dummy data with real backend integration
 */

import { gameService } from '@/api/gameApi'
import { useGameStore } from '@/stores/unifiedGameStore'
import { useGameStoreV2 } from '@/stores/gameStoreV2'
import { toast } from 'sonner'

export class GameInitializationService {
  private static instance: GameInitializationService

  static getInstance(): GameInitializationService {
    if (!GameInitializationService.instance) {
      GameInitializationService.instance = new GameInitializationService()
    }
    return GameInitializationService.instance
  }

  /**
   * Initialize game from backend data
   * @param gameNumber - The game room number from backend
   * @returns Promise that resolves when initialization is complete
   */
  async initializeGameFromBackend(gameNumber: number): Promise<void> {
    try {
      // Get fresh game state from backend
      const gameState = await gameService.getGameState(gameNumber)

      if (!gameState) {
        throw new Error('게임 정보를 찾을 수 없습니다')
      }

      console.log('Initializing game from backend data:', gameState)

      // Update unified store
      const unifiedStore = useGameStore.getState()
      unifiedStore.updateFromGameState(gameState)
      unifiedStore.setGameNumber(gameNumber)
      unifiedStore.setGameId(gameNumber.toString())

      // Convert backend players to V2 store format
      const backendPlayers = gameState.players.map(p => ({
        id: p.id.toString(),
        nickname: p.nickname,
        role: p.role as 'LIAR' | 'CITIZEN' | undefined
      }))

      // Initialize V2 store with real data
      const gameStoreV2 = useGameStoreV2.getState()
      gameStoreV2.initialize(
        gameNumber.toString(),
        backendPlayers,
        gameState.topic || '주제 로딩 중...',
        gameState.gameTotalRounds || 3
      )

      // Set initial game phase based on backend state
      const mappedPhase = this.mapBackendPhaseToV2Phase(gameState.gameState)
      gameStoreV2.startPhase(mappedPhase)

      // Initialize WebSocket connection for real-time updates
      await this.initializeRealTimeConnection(gameNumber)

      console.log('Game initialization completed successfully')

    } catch (error) {
      console.error('Failed to initialize game from backend:', error)
      throw error
    }
  }

  /**
   * Initialize real-time connection (WebSocket)
   * @param gameNumber - The game room number
   */
  private async initializeRealTimeConnection(gameNumber: number): Promise<void> {
    try {
      const unifiedStore = useGameStore.getState()
      await unifiedStore.connectWebSocket()

      // Set up event listeners for real-time updates
      this.setupRealTimeEventHandlers()

    } catch (error) {
      console.warn('WebSocket connection failed, setting up polling fallback:', error)

      // Set up polling as fallback
      const pollInterval = setInterval(async () => {
        try {
          const gameState = await gameService.getGameState(gameNumber)
          if (gameState) {
            const unifiedStore = useGameStore.getState()
            unifiedStore.updateFromGameState(gameState)

            // Sync with V2 store
            this.syncV2StoreWithBackend(gameState)
          }
        } catch (pollError) {
          console.error('Polling failed:', pollError)
        }
      }, 3000)

      // Store interval ID for cleanup
      ;(window as any).gamePollingInterval = pollInterval
    }
  }

  /**
   * Set up real-time event handlers
   */
  private setupRealTimeEventHandlers(): void {
    const unifiedStore = useGameStore.getState()

    // Override handleGameEvent to sync with V2 store
    const originalHandleGameEvent = unifiedStore.handleGameEvent
    unifiedStore.handleGameEvent = (event: any) => {
      originalHandleGameEvent(event)
      this.handleGameEventForV2Store(event)
    }
  }

  /**
   * Handle game events for V2 store synchronization
   */
  private handleGameEventForV2Store(event: any): void {
    const gameStoreV2 = useGameStoreV2.getState()

    switch (event.type) {
      case 'PLAYER_JOINED':
        // Add new player to V2 store
        gameStoreV2.initialize(
          gameStoreV2.gameId,
          [...gameStoreV2.players, {
            id: event.payload.playerId,
            nickname: event.payload.playerName
          }],
          gameStoreV2.gameData.topic,
          gameStoreV2.totalRounds
        )
        break

      case 'GAME_STARTED':
        gameStoreV2.startGame()
        break

      case 'PHASE_CHANGED':
        const mappedPhase = this.mapBackendPhaseToV2Phase(event.payload.phase)
        gameStoreV2.startPhase(mappedPhase)
        break

      case 'HINT_SUBMITTED':
        gameStoreV2.submitHint(event.payload.playerId, event.payload.hint)
        break

      case 'VOTE_CAST':
        gameStoreV2.castVote(event.payload.voterId, event.payload.targetId)
        break

      case 'DEFENSE_SUBMITTED':
        gameStoreV2.submitDefense(event.payload.playerId, event.payload.defense)
        break

      case 'ROUND_ENDED':
        gameStoreV2.finalizeRound()
        break
    }
  }

  /**
   * Sync V2 store with backend game state
   */
  private syncV2StoreWithBackend(gameState: any): void {
    const gameStoreV2 = useGameStoreV2.getState()

    // Update phase
    const mappedPhase = this.mapBackendPhaseToV2Phase(gameState.gameState)
    if (gameStoreV2.phase !== mappedPhase) {
      gameStoreV2.startPhase(mappedPhase)
    }

    // Update players if changed
    const backendPlayers = gameState.players.map((p: any) => ({
      id: p.id.toString(),
      nickname: p.nickname,
      role: p.role as 'LIAR' | 'CITIZEN' | undefined
    }))

    if (JSON.stringify(backendPlayers) !== JSON.stringify(gameStoreV2.players)) {
      gameStoreV2.initialize(
        gameStoreV2.gameId,
        backendPlayers,
        gameState.topic || gameStoreV2.gameData.topic,
        gameState.gameTotalRounds || gameStoreV2.totalRounds
      )
    }
  }

  /**
   * Map backend game phase to V2 store phase
   */
  private mapBackendPhaseToV2Phase(backendPhase: string): any {
    switch (backendPhase) {
      case 'WAITING':
        return 'WAITING_FOR_PLAYERS'
      case 'IN_PROGRESS':
        return 'SPEECH'
      case 'SPEECH':
        return 'SPEECH'
      case 'VOTING_FOR_LIAR':
        return 'VOTING_FOR_LIAR'
      case 'DEFENDING':
        return 'DEFENDING'
      case 'VOTING_FOR_SURVIVAL':
        return 'VOTING_FOR_SURVIVAL'
      case 'GUESSING_WORD':
        return 'GUESSING_WORD'
      case 'ENDED':
        return 'GAME_OVER'
      default:
        return 'WAITING_FOR_PLAYERS'
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clean up polling interval if exists
    if ((window as any).gamePollingInterval) {
      clearInterval((window as any).gamePollingInterval)
      delete (window as any).gamePollingInterval
    }

    // Disconnect WebSocket
    const unifiedStore = useGameStore.getState()
    unifiedStore.disconnectWebSocket()

    // Reset stores
    useGameStoreV2.getState().reset()
  }

  /**
   * Handle game room join from lobby
   */
  async joinGameRoom(gameNumber: number, playerNickname: string, password?: string): Promise<void> {
    try {
      const joinData = {
        gameNumber,
        playerNickname,
        password
      }

      const gameState = await gameService.joinGame(joinData)

      // Initialize game with joined state
      await this.initializeGameFromBackend(gameNumber)

      toast.success('게임방에 참가했습니다!')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '게임방 참가에 실패했습니다'
      toast.error(errorMessage)
      throw error
    }
  }

  /**
   * Create new game room
   */
  async createGameRoom(gameData: {
    hostNickname: string
    gameName: string
    gameMode: string
    maxPlayers: number
    timeLimit: number
    totalRounds: number
    isPrivate: boolean
    password?: string
  }): Promise<number> {
    try {
      const gameNumber = await gameService.createGame(gameData)

      // Initialize the created game
      await this.initializeGameFromBackend(gameNumber)

      toast.success('게임방을 생성했습니다!')
      return gameNumber

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '게임방 생성에 실패했습니다'
      toast.error(errorMessage)
      throw error
    }
  }
}

// Export singleton instance
export const gameInitializationService = GameInitializationService.getInstance()