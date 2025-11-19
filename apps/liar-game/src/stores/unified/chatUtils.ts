import type { ChatMessage, ChatMessageType } from '@/types/realtime'
import type { Player } from './types'

const CHAT_MESSAGE_LIMIT = 200
const CHAT_TYPES: readonly ChatMessageType[] = ['DISCUSSION', 'HINT', 'DEFENSE', 'SYSTEM', 'POST_ROUND', 'WAITING_ROOM', 'GENERAL'] as const

const normalizeChatType = (value: unknown): ChatMessageType => {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase()
    if ((CHAT_TYPES as readonly string[]).includes(normalized)) {
      return normalized as ChatMessageType
    }
    if (normalized === 'ANNOUNCEMENT' || normalized === 'NOTICE') {
      return 'SYSTEM'
    }
  }
  return 'DISCUSSION'
}

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return null
}

const toOptionalString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString()
  }
  return null
}

const resolvePlayerByIdentifiers = (players: Player[], identifiers: Array<string | number | null | undefined>): Player | undefined => {
  for (const identifier of identifiers) {
    if (identifier == null) {
      continue
    }
    const normalized = typeof identifier === 'number' ? identifier.toString() : identifier
    const match = players.find((player) => {
      if (player.id === normalized) return true
      if (player.userId != null && player.userId.toString() === normalized) return true
      if (player.nickname === normalized) return true
      return false
    })
    if (match) {
      return match
    }
  }
  return undefined
}

export const normalizeChatMessage = (
  rawMessage: Partial<ChatMessage> | Record<string, unknown>,
  players: Player[],
  defaultGameNumber: number | null
): ChatMessage => {
  const candidate = rawMessage as Record<string, unknown>

  const type = normalizeChatType(candidate['type'] ?? candidate['messageType'] ?? candidate['category'])
  const timestamp = toFiniteNumber(candidate['timestamp'] ?? candidate['createdAt'] ?? candidate['time']) ?? Date.now()
  const rawGameNumber = toFiniteNumber(candidate['gameNumber'] ?? candidate['gameId'] ?? candidate['roomId'])
  const gameNumber = rawGameNumber ?? (defaultGameNumber ?? 0)

  const userId = toFiniteNumber(candidate['userId'] ?? candidate['playerUserId'] ?? candidate['senderUserId']) ?? undefined
  const rawPlayerId = toOptionalString(candidate['playerId'] ?? candidate['playerID'] ?? candidate['playerUuid'] ?? candidate['senderId'])
  const rawNickname = toOptionalString(
    candidate['playerNickname']
    ?? candidate['playerNicknameSnapshot']
    ?? candidate['playerName']
    ?? candidate['nickname']
  )
  const content = toOptionalString(candidate['content'] ?? candidate['message'] ?? candidate['body'] ?? '') ?? ''

  const fallbackIdPart = rawPlayerId ?? (typeof userId === 'number' ? userId.toString() : type)
  const id =
    toOptionalString(candidate['id'] ?? candidate['messageId'] ?? candidate['eventId'] ?? candidate['uuid'])
    ?? `${gameNumber}-${timestamp}-${fallbackIdPart}`

  const resolvedPlayer = resolvePlayerByIdentifiers(players, [rawPlayerId, rawNickname, userId])

  const playerId = resolvedPlayer?.id ?? rawPlayerId ?? (typeof userId === 'number' ? userId.toString() : undefined)
  const nickname =
    resolvedPlayer?.nickname
    ?? rawNickname
    ?? (type === 'SYSTEM' ? 'SYSTEM' : `플레이어 ${playerId ?? (typeof userId === 'number' ? userId : '?')}`)

  return {
    id: id.toString(),
    gameNumber,
    playerId: playerId ?? undefined,
    userId,
    playerNickname: nickname,
    nickname,
    playerName: resolvedPlayer?.nickname ?? rawNickname ?? undefined,
    content,
    message: content,
    gameId: toOptionalString(candidate['gameId']) ?? (gameNumber ? gameNumber.toString() : undefined),
    roomId: toOptionalString(candidate['roomId'] ?? candidate['channelId'] ?? candidate['topic']) ?? undefined,
    timestamp,
    type,
  }
}

export const mergeChatMessages = (existing: ChatMessage[], next: ChatMessage[]): ChatMessage[] => {
  if (!next.length) {
    return existing
  }
  const map = new Map<string, ChatMessage>()
  for (const message of existing) {
    map.set(message.id, message)
  }
  for (const message of next) {
    map.set(message.id, message)
  }
  return Array.from(map.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-CHAT_MESSAGE_LIMIT)
}

export const CHAT_UTIL_LIMIT = CHAT_MESSAGE_LIMIT

