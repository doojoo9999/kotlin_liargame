package org.example.kotlin_liargame.domain.chat.service

import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import org.example.kotlin_liargame.domain.chat.repository.ChatMessageRepository
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

/**
 * 채팅 가능 여부 및 메시지 타입 결정을 전담하는 Resolver.
 * - 순수 로직 + 최소한의 Repository 접근
 * - 힌트 중복 여부 LRU 스타일 캐시로 1차 필터 후 DB 확인
 */
@Component
class ChatPolicyResolver(
    private val chatMessageRepository: ChatMessageRepository
) {
    data class ChatContext(
        val game: GameEntity,
        val player: PlayerEntity,
        val phase: GamePhase,
        val now: Instant = Instant.now()
    )

    data class ChatDecision(
        val allowed: Boolean,
        val type: ChatMessageType?
    )

    // (gameNumber, playerId) -> lastHintTimestamp
    private val lastHintCache = ConcurrentHashMap<Pair<Int, Long>, Instant>()
    private val maxCacheSize = 1000

    fun resolve(ctx: ChatContext): ChatDecision {
        val game = ctx.game
        val player = ctx.player

        if (!player.isAlive) return ChatDecision(false, null)

        if (game.gameState == GameState.IN_PROGRESS) {
            return when (ctx.phase) {
                GamePhase.SPEECH -> resolveSpeech(game, player)
                GamePhase.DEFENDING -> {
                    if (game.accusedPlayerId == player.userId) ChatDecision(true, ChatMessageType.DEFENSE)
                    else ChatDecision(true, ChatMessageType.DISCUSSION)
                }
                GamePhase.GUESSING_WORD -> {
                    if (player.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR) ChatDecision(true, ChatMessageType.DISCUSSION)
                    else ChatDecision(false, null)
                }
                GamePhase.VOTING_FOR_LIAR, GamePhase.VOTING_FOR_SURVIVAL -> ChatDecision(false, null)
                else -> ChatDecision(false, null)
            }
        }
        // 게임 종료 후 또는 라운드 종료 후 자유 채팅
        return ChatDecision(true, ChatMessageType.POST_ROUND)
    }

    private fun resolveSpeech(game: GameEntity, player: PlayerEntity): ChatDecision {
        if (game.currentPlayerId != player.userId) return ChatDecision(false, null)

        // 1차: 캐시로 현재 턴에서 이미 힌트 했는지 판단
        val key = game.gameNumber to player.userId
        val lastHintTs = lastHintCache[key]
        if (lastHintTs != null && game.turnStartedAt != null && lastHintTs.isAfter(game.turnStartedAt)) {
            return ChatDecision(false, null)
        }
        // 2차: DB 조회 (캐시 miss 또는 오래된 값)
        val existingHint = chatMessageRepository.findTopByGameAndPlayerAndTypeOrderByTimestampDesc(
            game, player, ChatMessageType.HINT
        )
        val hasProvided = existingHint != null && game.turnStartedAt != null && existingHint.timestamp.isAfter(game.turnStartedAt)
        return if (hasProvided) ChatDecision(false, null) else ChatDecision(true, ChatMessageType.HINT)
    }

    fun updateCacheAfterMessage(game: GameEntity, player: PlayerEntity, type: ChatMessageType, timestamp: Instant) {
        if (type == ChatMessageType.HINT) {
            val key = game.gameNumber to player.userId
            lastHintCache[key] = timestamp
            if (lastHintCache.size > maxCacheSize) pruneCache()
        }
    }

    private fun pruneCache() {
        // 단순: 오래된 절반 제거
        val entries = lastHintCache.entries.sortedBy { it.value }
        val removeCount = entries.size / 2
        for (i in 0 until removeCount) {
            lastHintCache.remove(entries[i].key)
        }
    }
}

