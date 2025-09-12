import React from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useGameStoreV2} from '@/stores/gameStoreV2'
import {GameFlowManagerV2} from '@/components/gameV2/GameFlowManager'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'

export function MainGamePageV2() {
  const { gameId } = useParams<{ gameId: string }>()
  const nav = useNavigate()
  const s = useGameStoreV2()

  React.useEffect(() => {
    if (!s.gameId && gameId) {
      // Demo seed players
      s.initialize(gameId, [
        { id: 'p1', nickname: '철수' },
        { id: 'p2', nickname: '영희' },
        { id: 'p3', nickname: '민수' },
      ], '과일', 3)
    }
  }, [gameId])

  if (!gameId) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-lg font-medium mb-4">잘못된 접근입니다</div>
              <Button onClick={() => nav('/lobby')}>로비로 이동</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <GameFlowManagerV2 />
}
// Game Flow v2 Types
export type PlayerID = string

export enum GamePhase {
  WAITING = 'WAITING',
  SPEECH = 'SPEECH',
  VOTING_FOR_LIAR = 'VOTING_FOR_LIAR',
  DEFENDING = 'DEFENDING',
  VOTING_FOR_SURVIVAL = 'VOTING_FOR_SURVIVAL',
  GUESSING_WORD = 'GUESSING_WORD',
  GAME_OVER = 'GAME_OVER',
}

export interface Player {
  id: PlayerID
  nickname: string
  role?: 'CITIZEN' | 'LIAR'
  isAlive?: boolean
}

export interface Hint {
  playerId: PlayerID
  text: string
  timestamp: number
}

export interface Vote {
  voterId: PlayerID
  targetId: PlayerID
  timestamp: number
}

export interface GameResults {
  winners: PlayerID[]
  reason: string
}

export interface GameStateV2 {
  gameId: string
  phase: GamePhase
  currentRound: number
  totalRounds: number
  timeRemaining: number
  currentPlayer?: PlayerID
  players: Player[]
  gameData: {
    topic: string
    secretWord?: string
    hints: Hint[]
    votes: Vote[]
    accusedPlayer?: PlayerID
    results?: GameResults
  }
  scores: Record<PlayerID, number>
}

