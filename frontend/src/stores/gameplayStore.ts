import {create} from 'zustand'
import {devtools} from 'zustand/middleware'

import {
    type ChatMessage,
    GAME_FLOW_SCHEMA_VERSION,
    type GameRealtimeEvent,
    type GameRealtimeEventType,
    type GameStateResponse,
    type PlayerResponse,
    type ScoreboardEntry,
    type VotingStatusResponse
} from '@/types/backendTypes'

export interface PlayerSummary {
  id: number
  userId: number
  nickname: string
  state: PlayerResponse['state']
  isAlive: boolean
  hasVoted: boolean
  votesReceived?: number | null
  role?: string | null
  hint?: string | null
  defense?: string | null
}

export interface VotingSnapshot {
  gameNumber: number
  currentVotes: number
  requiredVotes: number
  totalPlayers: number
  votedPlayers: VotingStatusResponse['votedPlayers']
  pendingPlayers: VotingStatusResponse['pendingPlayers']
  votingDeadline?: string | null
  canChangeVote: boolean
}

export interface CountdownTracker {
  id: string
  phase: GameStateResponse['currentPhase'] | string
  endsAt?: string | null
  remainingSeconds?: number
}

interface GameplayMetaState {
  gameNumber: number | null
  schemaVersion: string | null
  mode: GameStateResponse['gameMode'] | null
  round: {
    current: number
    total: number
  }
}

interface GameplayPhaseState {
  current: GameStateResponse['currentPhase']
  endsAt?: string | null
  turnOrder: string[]
  activePlayerId?: number | null
  accusedPlayerId?: number | null
}

interface GameplayPlayersState {
  byId: Record<number, PlayerSummary>
  order: number[]
}

interface GameplayChatState {
  messages: ChatMessage[]
  unreadCount: number
}

interface GameplayTimersState {
  items: Record<string, CountdownTracker>
}

export interface GameplayStoreState {
  meta: GameplayMetaState
  phase: GameplayPhaseState
  players: GameplayPlayersState
  scoreboard: ScoreboardEntry[]
  voting: VotingSnapshot | null
  chat: GameplayChatState
  timers: GameplayTimersState
  lastEventType: GameRealtimeEventType | null
  actions: {
    hydrateFromSnapshot: (snapshot: GameStateResponse) => void
    applyRealtimeEvent: (event: GameRealtimeEvent) => void
    setVotingStatus: (status: VotingStatusResponse) => void
    appendChatMessages: (messages: ChatMessage[]) => void
    reset: () => void
  }
}

const createInitialState = (): Omit<GameplayStoreState, 'actions'> => ({
  meta: {
    gameNumber: null,
    schemaVersion: null,
    mode: null,
    round: { current: 0, total: 0 }
  },
  phase: {
    current: 'WAITING_FOR_PLAYERS',
    endsAt: null,
    turnOrder: [],
    activePlayerId: null,
    accusedPlayerId: null
  },
  players: {
    byId: {},
    order: []
  },
  scoreboard: [],
  voting: null,
  chat: {
    messages: [],
    unreadCount: 0
  },
  timers: {
    items: {}
  },
  lastEventType: null
})

const buildPlayerSummary = (player: PlayerResponse): PlayerSummary => ({
  id: player.id,
  userId: player.userId,
  nickname: player.nickname,
  state: player.state,
  isAlive: player.isAlive,
  hasVoted: player.hasVoted,
  votesReceived: player.votesReceived,
  role: player.state === 'ACCUSED' ? 'ACCUSING' : undefined,
  hint: player.hint,
  defense: player.defense
})

export const useGameplayStore = create<GameplayStoreState>()(
  devtools((set, get) => ({
    ...createInitialState(),
    actions: {
      hydrateFromSnapshot: (snapshot) => {
        const playerSummaries = snapshot.players.map(buildPlayerSummary)
        const byId = Object.fromEntries(playerSummaries.map((summary) => [summary.id, summary]))
        const order = snapshot.turnOrder?.map((id) => Number(id)) ?? playerSummaries.map((summary) => summary.id)

        set((state) => ({
          ...state,
          meta: {
            gameNumber: snapshot.gameNumber,
            schemaVersion: snapshot.schemaVersion ?? GAME_FLOW_SCHEMA_VERSION,
            mode: snapshot.gameMode,
            round: {
              current: snapshot.gameCurrentRound,
              total: snapshot.gameTotalRounds
            }
          },
          phase: {
            current: snapshot.currentPhase,
            endsAt: snapshot.phaseEndTime ?? null,
            turnOrder: snapshot.turnOrder ?? [],
            activePlayerId: snapshot.currentTurnIndex != null ? order[snapshot.currentTurnIndex] ?? null : null,
            accusedPlayerId: snapshot.accusedPlayer?.id ?? null
          },
          players: {
            byId,
            order
          },
          scoreboard: snapshot.scoreboard,
          voting: state.voting?.gameNumber === snapshot.gameNumber ? state.voting : null,
          lastEventType: null
        }))
      },
      applyRealtimeEvent: (event) => {
        set((state) => ({
          ...state,
          lastEventType: event.type
        }))
        // Detailed event reducers will be implemented during Step 2
      },
      setVotingStatus: (status) => {
        set((state) => ({
          ...state,
          voting: {
            gameNumber: status.gameNumber,
            currentVotes: status.currentVotes,
            requiredVotes: status.requiredVotes,
            totalPlayers: status.totalPlayers,
            votedPlayers: status.votedPlayers,
            pendingPlayers: status.pendingPlayers,
            votingDeadline: status.votingDeadline ?? null,
            canChangeVote: status.canChangeVote
          }
        }))
      },
      appendChatMessages: (messages) => {
        if (!Array.isArray(messages) || messages.length === 0) {
          return
        }
        set((state) => ({
          ...state,
          chat: {
            messages: [...state.chat.messages, ...messages].slice(-200),
            unreadCount: state.chat.unreadCount + messages.length
          }
        }))
      },
      reset: () => {
        set(() => ({
          ...createInitialState()
        }))
      }
    }
  }), { name: 'gameplay-store' })
)

export const selectGameplayMeta = (state: GameplayStoreState) => state.meta
export const selectGameplayPhase = (state: GameplayStoreState) => state.phase
export const selectGameplayPlayers = (state: GameplayStoreState) => state.players
export const selectGameplayVoting = (state: GameplayStoreState) => state.voting
export const selectGameplayChat = (state: GameplayStoreState) => state.chat
