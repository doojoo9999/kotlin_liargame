import type {ComponentProps} from 'react'
import {PlayerStatusPanel} from '../PlayerStatusPanel'
import type {Player} from '@/types/game'
import type {GamePhase} from '@/types/backendTypes'

const samplePlayers: Player[] = [
  {
    id: '1',
    nickname: '호스트',
    isHost: true,
    isAlive: true,
    isOnline: true,
    isReady: true,
    hasVoted: true,
    score: 12,
  },
  {
    id: '2',
    nickname: '시민 A',
    isAlive: true,
    isOnline: true,
    isReady: true,
    hasVoted: false,
    score: 8,
  },
  {
    id: '3',
    nickname: '의심받는 라이어',
    isAlive: true,
    isOnline: true,
    isReady: false,
    hasVoted: false,
    score: 14,
  },
  {
    id: '4',
    nickname: '오프라인 플레이어',
    isAlive: true,
    isOnline: false,
    isReady: false,
    hasVoted: false,
    score: 6,
  },
]

const phase: GamePhase = 'VOTING_FOR_LIAR'

const defaults: ComponentProps<typeof PlayerStatusPanel> = {
  players: samplePlayers,
  currentPhase: phase,
  currentPlayer: samplePlayers[0],
  currentTurnPlayerId: '2',
  votes: { '1': '3' },
  isLiar: false,
  suspectedPlayer: '3',
}

const meta = {
  title: 'Game/PlayerStatusPanel',
  component: PlayerStatusPanel,
  args: defaults,
}

export default meta

export const Default = {}

export const WithLiarPerspective = {
  args: {
    isLiar: true,
    currentPlayer: samplePlayers[2],
    currentTurnPlayerId: '3',
  },
}
