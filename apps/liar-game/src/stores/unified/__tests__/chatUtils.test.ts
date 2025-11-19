import {describe, expect, it} from 'vitest'
import {mergeChatMessages, normalizeChatMessage} from '../chatUtils'
import type {Player} from '../types'
import type {ChatMessage} from '@/types/realtime'

describe('chatUtils', () => {
  const players: Player[] = [
    {id: '1', userId: 10, nickname: 'citizenA', score: 0, isAlive: true, state: 'WAITING_FOR_HINT'},
    {id: '2', userId: 11, nickname: 'liarZ', score: 0, isAlive: true, state: 'WAITING_FOR_HINT'},
  ]

  describe('normalizeChatMessage', () => {
    it('resolves player information using flexible identifiers', () => {
      const raw = {
        message: '안녕하세요',
        playerId: '1',
        timestamp: 123,
      }

      const normalized = normalizeChatMessage(raw, players, 100001)

      expect(normalized.nickname).toBe('citizenA')
      expect(normalized.gameNumber).toBe(100001)
      expect(normalized.type).toBe('DISCUSSION')
      expect(normalized.id).toContain('citizenA')
    })

    it('derives system message defaults when identifiers are missing', () => {
      const normalized = normalizeChatMessage({
        content: '시스템 알림',
        type: 'NOTICE',
        gameNumber: 222222,
      }, players, null)

      expect(normalized.type).toBe('SYSTEM')
      expect(normalized.nickname).toBe('SYSTEM')
      expect(normalized.gameNumber).toBe(222222)
    })
  })

  describe('mergeChatMessages', () => {
    it('deduplicates by message id and keeps chronological order', () => {
      const existing: ChatMessage[] = [
        {id: '1', timestamp: 100, type: 'DISCUSSION', message: 'old', content: 'old', gameNumber: 1, playerNickname: 'tester'}
      ]
      const next = [
        {id: '1', timestamp: 150, type: 'DISCUSSION', message: 'updated', content: 'updated', gameNumber: 1, playerNickname: 'tester'},
        {id: '2', timestamp: 125, type: 'DISCUSSION', message: 'new', content: 'new', gameNumber: 1, playerNickname: 'tester'},
      ] as ChatMessage[]

      const merged = mergeChatMessages(existing, next)

      expect(merged).toHaveLength(2)
      expect(merged[0].id).toBe('2')
      expect(merged[1].message).toBe('updated')
    })
  })
})
