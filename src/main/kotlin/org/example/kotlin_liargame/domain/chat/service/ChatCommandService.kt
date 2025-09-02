package org.example.kotlin_liargame.domain.chat.service

import org.example.kotlin_liargame.domain.chat.dto.request.SendChatMessageRequest
import org.example.kotlin_liargame.domain.chat.dto.response.ChatMessageResponse
import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
import org.example.kotlin_liargame.domain.chat.repository.ChatMessageRepository
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.profanity.service.ProfanityService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class ChatCommandService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val profanityService: ProfanityService,
    private val chatPolicyResolver: ChatPolicyResolver,
    private val turnProgressService: TurnProgressService,
    private val chatSystemMessenger: ChatSystemMessenger
) {

    @Transactional
    fun handleSend(userId: Long, req: SendChatMessageRequest): ChatMessageResponse {
        validateContent(req)
        val game = gameRepository.findByGameNumber(req.gameNumber) ?: throw RuntimeException("Game not found")
        val player = playerRepository.findByGameAndUserId(game, userId) ?: throw RuntimeException("You are not in this game")

        val phase = when (game.gameState) {
            org.example.kotlin_liargame.domain.game.model.enum.GameState.IN_PROGRESS -> game.currentPhase
            org.example.kotlin_liargame.domain.game.model.enum.GameState.WAITING -> GamePhase.WAITING_FOR_PLAYERS
            org.example.kotlin_liargame.domain.game.model.enum.GameState.ENDED -> GamePhase.GAME_OVER
        }
        val decision = chatPolicyResolver.resolve(ChatPolicyResolver.ChatContext(game, player, phase))
        if (!decision.allowed || decision.type == null) throw RuntimeException("Chat not available")

        val entity = ChatMessageEntity(
            game = game,
            player = player,
            content = req.getSanitizedContent(),
            type = decision.type
        )
        game.lastActivityAt = Instant.now()
        val saved = chatMessageRepository.save(entity)

        chatPolicyResolver.updateCacheAfterMessage(game, player, decision.type, saved.timestamp)
        turnProgressService.handleAfterMessage(game, decision.type, player.userId)

        // 브로드캐스트 (컨트롤러에서 중복 송신 제거됨)
        chatSystemMessenger.broadcast(saved)
        return ChatMessageResponse.from(saved)
    }

    private fun validateContent(req: SendChatMessageRequest) {
        if (!req.isValidLength()) throw IllegalArgumentException("메시지 길이가 유효하지 않습니다.")
        val lowered = req.content.lowercase()
        val approved = profanityService.getApprovedWords()
        if (approved.any { lowered.contains(it) }) throw IllegalArgumentException("메시지에 부적절한 단어가 포함되어 있습니다.")
    }
}

