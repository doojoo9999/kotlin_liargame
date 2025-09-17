import type {GameRoomInfo} from '@/types/api'
import type {GameState as BackendGameState} from '@/types/backendTypes'

type LegacyGameStatus = 'waiting' | 'playing' | 'finished'

export interface LegacyGameRoom {
  id: string
  sessionCode: string
  name: string
  hostName: string
  currentPlayers: number
  maxPlayers: number
  timeLimit: number
  totalRounds: number
  status: LegacyGameStatus
  isPrivate: boolean
  original: GameRoomInfo
}

const statusMap: Record<BackendGameState, LegacyGameStatus> = {
  WAITING: 'waiting',
  IN_PROGRESS: 'playing',
  ENDED: 'finished',
}

const getNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

export const mapGameRoomInfoToLegacy = (room: GameRoomInfo): LegacyGameRoom => {
  const currentPlayers = room.currentPlayers ?? room.gameParticipants ?? 0
  const maxPlayers = room.maxPlayers ?? room.gameMaxPlayers ?? 0
  const status = statusMap[room.state ?? room.gameState ?? 'WAITING'] ?? 'waiting'

  const rawTimeLimit = (room as Record<string, unknown>).timeLimitSeconds ?? (room as Record<string, unknown>).timeLimit
  const rawRounds = (room as Record<string, unknown>).gameTotalRounds ?? (room as Record<string, unknown>).totalRounds

  return {
    id: room.gameNumber.toString(),
    sessionCode: room.gameNumber.toString(),
    name: room.title ?? room.gameName ?? `Game #${room.gameNumber}`,
    hostName: room.host ?? room.gameOwner ?? 'Unknown',
    currentPlayers,
    maxPlayers,
    timeLimit: getNumber(rawTimeLimit, 120),
    totalRounds: getNumber(rawRounds, 3),
    status,
    isPrivate: room.hasPassword ?? room.isPrivate ?? false,
    original: room,
  }
}
