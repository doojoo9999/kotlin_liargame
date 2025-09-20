/**
 * Game Initialization Service
 * Handles proper initialization of game state from backend data
 * Replaces all dummy data with real backend integration
 */

import {gameService} from '@/api/gameApi'
import {useGameStore} from '@/stores/unifiedGameStore'
import {toast} from 'sonner'
import type {CreateGameRequest, GameMode} from '@/types/backendTypes'

type PollingHandle = ReturnType<typeof setInterval>

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
      const gameState = await gameService.getGameState(gameNumber)

      if (!gameState) {
        throw new Error('게임 정보를 찾을 수 없습니다')
      }

      const unifiedStore = useGameStore.getState()
      unifiedStore.updateFromGameState(gameState)
      unifiedStore.setGameNumber(gameNumber)
      unifiedStore.setGameId(gameNumber.toString())

      await this.initializeRealTimeConnection(gameNumber)

      console.log('Game initialization completed successfully')
    } catch (error) {
      console.error('Failed to initialize game from backend:', error)
      throw error
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    const windowRef = window as { gamePollingInterval?: PollingHandle }
    if (windowRef.gamePollingInterval) {
      clearInterval(windowRef.gamePollingInterval)
      delete windowRef.gamePollingInterval
    }

    const unifiedStore = useGameStore.getState()
    unifiedStore.disconnectWebSocket()
    if (typeof unifiedStore.resetGame === 'function') {
      unifiedStore.resetGame()
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
    } catch (error) {
      console.warn('WebSocket connection failed, setting up polling fallback:', error)
      this.startPollingFallback(gameNumber)
    }
  }

  /**
   * Handle game room join from lobby
   */
  async joinGameRoom(gameNumber: number, playerNickname: string, password?: string): Promise<void> {
    try {
      const joinData = {
        gameNumber,
        nickname: playerNickname,
        gamePassword: password
      }

      await gameService.joinGame(joinData)

      console.log('Joined game room successfully, gameNumber:', gameNumber)

      toast.success('게임방에 참가했습니다!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '게임방 참가에 실패했습니다'
      toast.error(errorMessage)
      throw error
    }
  }

  private startPollingFallback(gameNumber: number): void {
    const pollInterval: PollingHandle = setInterval(async () => {
      try {
        const gameState = await gameService.getGameState(gameNumber)
        if (gameState) {
          const unifiedStore = useGameStore.getState()
          unifiedStore.updateFromGameState(gameState)
        }
      } catch (pollError) {
        console.error('Polling failed:', pollError)
      }
    }, 3000)

    ;(window as { gamePollingInterval?: PollingHandle }).gamePollingInterval = pollInterval
  }

  /**
   * Create new game room
   */
  async createGameRoom(gameData: {
    hostNickname: string
    gameName: string
    gameMode: GameMode | string
    gameParticipants: number
    gameLiarCount: number
    gameTotalRounds: number
    targetPoints: number
    isPrivate: boolean
    password?: string
    useRandomSubjects: boolean
    selectedSubjectIds: number[]
    randomSubjectCount?: number
  }): Promise<number> {
    try {
      const payload: CreateGameRequest = {
        nickname: gameData.hostNickname,
        gameName: gameData.gameName,
        gamePassword: gameData.isPrivate ? gameData.password ?? undefined : undefined,
        gameParticipants: gameData.gameParticipants,
        gameLiarCount: gameData.gameLiarCount,
        gameTotalRounds: gameData.gameTotalRounds,
        gameMode: gameData.gameMode as GameMode,
        subjectIds: !gameData.useRandomSubjects ? gameData.selectedSubjectIds : undefined,
        useRandomSubjects: gameData.useRandomSubjects,
        randomSubjectCount: gameData.useRandomSubjects ? (gameData.randomSubjectCount ?? Math.min(gameData.selectedSubjectIds.length, 5)) : undefined,
        targetPoints: gameData.targetPoints
      }

      const gameNumber = await gameService.createGame(payload)

      console.log('Game room created successfully with number:', gameNumber)

      toast.success('게임방을 생성했습니다!')
      return gameNumber
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '게임방 생성에 실패했습니다'
      toast.error(errorMessage)
      throw error
    }
  }
}

export const gameInitializationService = GameInitializationService.getInstance()
