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

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return undefined
}

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.length > 0) {
    return value
  }
  return undefined
}

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value
  }
  return undefined
}

const KNOWN_GAME_PHASES = new Set<GameStateResponse['currentPhase']>([
  'WAITING_FOR_PLAYERS',
  'SPEECH',
  'VOTING_FOR_LIAR',
  'DEFENDING',
  'VOTING_FOR_SURVIVAL',
  'GUESSING_WORD',
  'GAME_OVER'
])

const toGamePhase = (
  value: unknown,
  fallback: GameStateResponse['currentPhase']
): GameStateResponse['currentPhase'] => {
  if (typeof value === 'string' && KNOWN_GAME_PHASES.has(value as GameStateResponse['currentPhase'])) {
    return value as GameStateResponse['currentPhase']
  }
  return fallback
}

const toNumberArray = (value: unknown): number[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined
  }
  const numbers = value
    .map((item) => toNumber(item))
    .filter((item): item is number => item != null)
  return numbers
}

const computeDeadline = (timestamp: string | undefined, seconds?: number): string | null => {
  if (!timestamp || typeof seconds !== 'number' || Number.isNaN(seconds)) {
    return null
  }
  const base = Date.parse(timestamp)
  if (Number.isNaN(base)) {
    return null
  }
  return new Date(base + seconds * 1000).toISOString()
}

const normalizeScoreboardBroadcast = (players: Array<Record<string, unknown>>): ScoreboardEntry[] => {
  if (!Array.isArray(players)) {
    return []
  }
  return players
    .map((raw) => {
      if (!raw || typeof raw !== 'object') {
        return null
      }
      const userId = toNumber((raw as Record<string, unknown>)['userId'])
      const nickname = toStringValue((raw as Record<string, unknown>)['nickname'])
      const score = toNumber((raw as Record<string, unknown>)['score'])
      const isAlive = toBoolean((raw as Record<string, unknown>)['isAlive'])
      if (userId == null || nickname == null || score == null) {
        return null
      }
      return {
        userId,
        nickname,
        score,
        isAlive: isAlive ?? true
      }
    })
    .filter((entry): entry is ScoreboardEntry => entry != null)
}

const buildSystemChatMessage = (
  gameNumber: number | null,
  content: string,
  timestamp: string,
  nickname = 'SYSTEM',
  type: ChatMessage['type'] = 'SYSTEM'
): ChatMessage => ({
  id: null,
  gameNumber: gameNumber ?? 0,
  playerNickname: nickname,
  content,
  timestamp,
  type
})

export const useGameplayStore = create<GameplayStoreState>()(
  devtools((set) => ({
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
        set((state) => {
          let meta = state.meta
          let phase = state.phase
          let playersById = state.players.byId
          const playersOrder = state.players.order
          let playersChanged = false
          let scoreboard = state.scoreboard
          let voting = state.voting
          let chatMessages = state.chat.messages
          let unreadCount = state.chat.unreadCount
          let chatChanged = false
          let timerItems = state.timers.items
          let timersChanged = false

          const payloadSchemaVersion = (event.payload as { schemaVersion?: string }).schemaVersion
          if (payloadSchemaVersion && payloadSchemaVersion !== state.meta.schemaVersion) {
            meta = {
              ...meta,
              schemaVersion: payloadSchemaVersion
            }
          }

          const currentGameNumber =
            meta.gameNumber ?? (event as { payload?: { gameNumber?: number } }).payload?.gameNumber ?? null

          const ensureVotingSnapshot = (defaults: Partial<VotingSnapshot> = {}): VotingSnapshot => {
            const base: VotingSnapshot = voting ?? {
              gameNumber: defaults.gameNumber ?? currentGameNumber ?? 0,
              currentVotes: 0,
              requiredVotes: defaults.requiredVotes ?? 0,
              totalPlayers: defaults.totalPlayers ?? 0,
              votedPlayers: [],
              pendingPlayers: [],
              votingDeadline: null,
              canChangeVote: true
            }
            return {
              ...base,
              ...defaults
            }
          }

          const pushSystemMessage = (message: ChatMessage) => {
            chatMessages = [...chatMessages, message].slice(-200)
            unreadCount += 1
            chatChanged = true
          }

          switch (event.type) {
            case 'PHASE_CHANGE': {
              const additionalData = (event.payload.additionalData ?? {}) as Record<string, unknown>
              const turnOrder = toNumberArray(additionalData['turnOrder'])?.map((id) => id.toString())
              const activeId = toNumber(additionalData['currentSpeakerId'] ?? additionalData['currentTurnPlayerId'])
              const accusedId = toNumber(additionalData['accusedPlayerId'])
              const phaseEndsAt = toStringValue(additionalData['phaseEndsAt'] ?? additionalData['phaseEndTime'])
              const currentRound = toNumber(additionalData['currentRound'])
              const totalRounds = toNumber(additionalData['totalRounds'])

              phase = {
                ...phase,
                current: toGamePhase(event.payload.phase, phase.current),
                endsAt: phaseEndsAt ?? null,
                turnOrder: turnOrder ?? phase.turnOrder,
                activePlayerId: activeId ?? phase.activePlayerId ?? null,
                accusedPlayerId: accusedId ?? null
              }

              if (currentRound != null || totalRounds != null) {
                meta = {
                  ...meta,
                  round: {
                    current: currentRound ?? meta.round.current,
                    total: totalRounds ?? meta.round.total
                  }
                }
              }
              break
            }
            case 'CURRENT_TURN': {
              phase = {
                ...phase,
                activePlayerId: event.payload.currentSpeakerId
              }
              break
            }
            case 'DEFENSE_START': {
              phase = {
                ...phase,
                accusedPlayerId: event.payload.accusedPlayerId
              }
              const deadline = computeDeadline(event.payload.timestamp, event.payload.defenseTimeLimit)
              timerItems = {
                ...timerItems,
                defense: {
                  id: 'defense',
                  phase: 'DEFENDING',
                  endsAt: deadline,
                  remainingSeconds: event.payload.defenseTimeLimit
                }
              }
              timersChanged = true
              break
            }
            case 'DEFENSE_SUBMISSION': {
              const targetPlayerId = playersOrder.find((id) => playersById[id]?.userId === event.payload.userId)
              if (targetPlayerId != null && playersById[targetPlayerId]) {
                playersById = {
                  ...playersById,
                  [targetPlayerId]: {
                    ...playersById[targetPlayerId],
                    defense: event.payload.defenseText
                  }
                }
                playersChanged = true
              }
              break
            }
            case 'DEFENSE_TIMEOUT': {
              if ('defense' in timerItems) {
                const rest = {...timerItems}
                delete rest.defense
                timerItems = rest
                timersChanged = true
              }
              break
            }
            case 'VOTING_START': {
              const totalPlayers = event.payload.availablePlayers.length
              const votingDeadline = computeDeadline(event.payload.timestamp, event.payload.votingTimeLimit)
              const pendingPlayers = event.payload.availablePlayers.map((player) => ({
                userId: player.id,
                nickname: player.nickname,
                votedAt: null
              })) as VotingStatusResponse['pendingPlayers']
              voting = ensureVotingSnapshot({
                gameNumber: event.payload.gameNumber,
                currentVotes: 0,
                requiredVotes: Math.max(1, Math.floor(totalPlayers / 2) + 1),
                totalPlayers,
                votedPlayers: [],
                pendingPlayers,
                votingDeadline,
                canChangeVote: true
              })
              const deadline = computeDeadline(event.payload.timestamp, event.payload.votingTimeLimit)
              timerItems = {
                ...timerItems,
                voting: {
                  id: 'voting',
                  phase: phase.current,
                  endsAt: deadline,
                  remainingSeconds: event.payload.votingTimeLimit
                }
              }
              timersChanged = true
              break
            }
            case 'VOTING_PROGRESS': {
              const totalPlayers = event.payload.totalCount
              voting = ensureVotingSnapshot({
                gameNumber: event.payload.gameNumber,
                currentVotes: event.payload.votedCount,
                totalPlayers,
                requiredVotes: voting?.requiredVotes ?? Math.max(1, Math.floor(totalPlayers / 2) + 1)
              })
              break
            }
            case 'FINAL_VOTING_START': {
              const votingDeadline = computeDeadline(event.payload.timestamp, event.payload.votingTimeLimit)
              const pendingPlayers = playersOrder
                .filter((id) => id !== event.payload.accusedPlayerId)
                .map((id) => ({
                  userId: playersById[id]?.userId ?? id,
                  nickname: playersById[id]?.nickname ?? `Player ${id}`,
                  votedAt: null
                })) as VotingStatusResponse['pendingPlayers']
              voting = ensureVotingSnapshot({
                gameNumber: event.payload.gameNumber,
                currentVotes: 0,
                requiredVotes:
                  voting?.requiredVotes ?? Math.max(1, Math.floor(Math.max(playersOrder.length - 1, 1) / 2) + 1),
                totalPlayers: Math.max(playersOrder.length - 1, 0),
                votedPlayers: [],
                pendingPlayers,
                votingDeadline,
                canChangeVote: false
              })
              const deadline = computeDeadline(event.payload.timestamp, event.payload.votingTimeLimit)
              timerItems = {
                ...timerItems,
                finalVoting: {
                  id: 'finalVoting',
                  phase: 'VOTING_FOR_SURVIVAL',
                  endsAt: deadline,
                  remainingSeconds: event.payload.votingTimeLimit
                }
              }
              timersChanged = true
              break
            }
            case 'FINAL_VOTING_PROGRESS': {
              const totalPlayers = event.payload.totalCount
              voting = ensureVotingSnapshot({
                gameNumber: event.payload.gameNumber,
                currentVotes: event.payload.votedCount,
                totalPlayers,
                canChangeVote: false
              })
              break
            }
            case 'FINAL_VOTING_RESULT': {
              voting = {
                gameNumber: event.payload.gameNumber,
                currentVotes: event.payload.executionVotes + event.payload.survivalVotes,
                requiredVotes: event.payload.totalVotes,
                totalPlayers: event.payload.totalVotes,
                votedPlayers: event.payload.finalVotingRecord.map((record) => ({
                  userId: record.voterPlayerId,
                  nickname: record.voterNickname,
                  votedAt: null
                })),
                pendingPlayers: [],
                votingDeadline: null,
                canChangeVote: false
              }
              scoreboard = event.payload.scoreboard
              const restTimers = {...timerItems}
              delete restTimers.voting
              delete restTimers.finalVoting
              timerItems = restTimers
              timersChanged = true
              break
            }
            case 'SPEECH_TIMER': {
              const timerId = `speech-${event.payload.userId}`
              const deadline = computeDeadline(event.payload.timestamp, event.payload.remainingTime)
              timerItems = {
                ...timerItems,
                [timerId]: {
                  id: timerId,
                  phase: phase.current,
                  endsAt: deadline,
                  remainingSeconds: event.payload.remainingTime
                }
              }
              timersChanged = true
              break
            }
            case 'COUNTDOWN_UPDATE': {
              timerItems = {
                ...timerItems,
                countdown: {
                  id: 'countdown',
                  phase: event.payload.phase,
                  endsAt: null,
                  remainingSeconds: event.payload.remainingTime
                }
              }
              timersChanged = true
              break
            }
            case 'SCOREBOARD': {
              scoreboard = normalizeScoreboardBroadcast(event.payload.players)
              break
            }
            case 'GAME_END': {
              phase = {
                ...phase,
                current: 'GAME_OVER',
                activePlayerId: null,
                accusedPlayerId: null,
                endsAt: null
              }
              meta = {
                ...meta,
                round: {
                  current: event.payload.gameStatistics.currentRound,
                  total: event.payload.gameStatistics.totalRounds
                }
              }
              if (Object.keys(timerItems).length > 0) {
                timerItems = {}
                timersChanged = true
              }
              pushSystemMessage(
                buildSystemChatMessage(
                  currentGameNumber,
                  `게임 종료 - 승리 팀: ${event.payload.winner}`,
                  event.payload.timestamp,
                  'SYSTEM',
                  'POST_ROUND'
                )
              )
              break
            }
            case 'TERMINATION': {
              phase = {
                ...phase,
                current: 'GAME_OVER',
                activePlayerId: null,
                accusedPlayerId: null,
                endsAt: null
              }
              if (Object.keys(timerItems).length > 0) {
                timerItems = {}
                timersChanged = true
              }
              pushSystemMessage(
                buildSystemChatMessage(
                  currentGameNumber,
                  `게임이 종료되었습니다: ${event.payload.message}`,
                  event.payload.timestamp
                )
              )
              break
            }
            case 'LIAR_GUESS_START': {
              phase = {
                ...phase,
                current: 'GUESSING_WORD',
                activePlayerId: event.payload.liarPlayer.id
              }
              const liarSummary = playersById[event.payload.liarPlayer.id]
              if (liarSummary) {
                playersById = {
                  ...playersById,
                  [event.payload.liarPlayer.id]: {
                    ...liarSummary,
                    role: event.payload.liarPlayer.role ?? liarSummary.role
                  }
                }
                playersChanged = true
              }
              const timerId = 'liarGuess'
              const deadline = computeDeadline(event.payload.timestamp, event.payload.guessTimeLimit)
              timerItems = {
                ...timerItems,
                [timerId]: {
                  id: timerId,
                  phase: 'GUESSING_WORD',
                  endsAt: deadline,
                  remainingSeconds: event.payload.guessTimeLimit
                }
              }
              timersChanged = true
              break
            }
            case 'LIAR_GUESS_RESULT': {
              pushSystemMessage(
                buildSystemChatMessage(
                  currentGameNumber,
                  `라이어의 추측 "${event.payload.liarGuess}" — ${event.payload.isCorrect ? '정답' : '실패'}`,
                  new Date().toISOString(),
                  'SYSTEM',
                  'POST_ROUND'
                )
              )
              if (event.payload.gameEnd) {
                phase = {
                  ...phase,
                  current: 'GAME_OVER',
                  activePlayerId: null,
                  accusedPlayerId: null,
                  endsAt: null
                }
                if (Object.keys(timerItems).length > 0) {
                  timerItems = {}
                  timersChanged = true
                }
              }
              break
            }
            case 'MODERATOR': {
              const label = event.payload.isImportant ? '[공지]' : '[안내]'
              pushSystemMessage(
                buildSystemChatMessage(
                  currentGameNumber,
                  `${label} ${event.payload.content}`,
                  event.payload.timestamp
                )
              )
              break
            }
            case 'STATUS_MESSAGE': {
              pushSystemMessage(
                buildSystemChatMessage(
                  currentGameNumber,
                  event.payload.content,
                  event.payload.timestamp
                )
              )
              break
            }
            case 'LIAR_MESSAGE': {
              pushSystemMessage(
                buildSystemChatMessage(
                  currentGameNumber,
                  event.payload.content,
                  event.payload.timestamp
                )
              )
              break
            }
            default:
              break
          }

          return {
            ...state,
            meta,
            phase,
            players: playersChanged ? { byId: playersById, order: playersOrder } : state.players,
            scoreboard,
            voting,
            chat: chatChanged ? { messages: chatMessages, unreadCount } : state.chat,
            timers: timersChanged ? { items: timerItems } : state.timers,
            lastEventType: event.type
          }
        })
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
