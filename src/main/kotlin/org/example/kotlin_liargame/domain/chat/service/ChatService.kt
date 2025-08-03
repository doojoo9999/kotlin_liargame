package org.example.kotlin_liargame.domain.chat.service

import org.example.kotlin_liargame.domain.chat.dto.request.GetChatHistoryRequest
import org.example.kotlin_liargame.domain.chat.dto.request.SendChatMessageRequest
import org.example.kotlin_liargame.domain.chat.dto.response.ChatMessageResponse
import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
import org.example.kotlin_liargame.domain.chat.model.ChatMessageType
import org.example.kotlin_liargame.domain.chat.repository.ChatMessageRepository
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.tools.security.UserPrincipal
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

@Service
class ChatService(
    private val chatMessageRepository: ChatMessageRepository,
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {
    private val postRoundChatWindows = ConcurrentHashMap<Int, Instant>()

    private val scheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(1)

    private val POST_ROUND_CHAT_DURATION = 7L

    fun getCurrentUserId(): Long {
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication != null && authentication.principal is UserPrincipal) {
            val principal = authentication.principal as UserPrincipal
            return principal.userId
        }

        println("[WARN] No authentication found in SecurityContext, using default user ID")
        return 1L
    }

    fun getCurrentUserIdForWebSocket(overrideUserId: Long?): Long {
        if (overrideUserId != null) return overrideUserId
        
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication?.principal is UserPrincipal) {
            return (authentication.principal as UserPrincipal).userId
        }
        println("[WARN] No authentication found for WebSocket, using default user ID")
        return 1L
    }

    @Transactional
    fun sendMessageViaWebSocket(req: SendChatMessageRequest, sessionUserId: Long? = null): ChatMessageResponse {
        req.validate()
        
        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")
        
        val userId = getCurrentUserIdForWebSocket(sessionUserId)
        println("[DEBUG] WebSocket message from userId: $userId")
        
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")
        
        val messageType = if (game.gState == GameState.WAITING) {
            ChatMessageType.LOBBY
        } else {
            determineMessageType(game, player) ?: ChatMessageType.POST_ROUND
        }
        
        val chatMessage = ChatMessageEntity(
            game = game,
            player = player,
            content = req.content,
            type = messageType
        )
        
        val savedMessage = chatMessageRepository.save(chatMessage)
        println("[DEBUG] Chat message saved to database: ${savedMessage.id}")
        
        return ChatMessageResponse.from(savedMessage)
    }

    @Transactional
    fun sendMessage(req: SendChatMessageRequest, overrideUserId: Long? = null): ChatMessageResponse {
        req.validate()

        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")

        val userId = overrideUserId ?: getCurrentUserId()
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")

        if (game.gState == GameState.IN_PROGRESS) {
            if (!player.isAlive) {
                throw RuntimeException("You are eliminated from the game")
            }

            val messageType = determineMessageType(game, player)

            if (messageType == null) {
                throw RuntimeException("Chat is not available at this time")
            }

            val chatMessage = ChatMessageEntity(
                game = game,
                player = player,
                content = req.content,
                type = messageType
            )

            val savedMessage = chatMessageRepository.save(chatMessage)
            return ChatMessageResponse.from(savedMessage)
        }
        else {
            val messageType = if (game.gState == GameState.WAITING) {
                ChatMessageType.LOBBY
            } else {
                ChatMessageType.POST_ROUND
            }

            val chatMessage = ChatMessageEntity(
                game = game,
                player = player,
                content = req.content,
                type = messageType
            )

            val savedMessage = chatMessageRepository.save(chatMessage)
            return ChatMessageResponse.from(savedMessage)
        }
    }

    @Transactional(readOnly = true)
    fun getChatHistory(req: GetChatHistoryRequest): List<ChatMessageResponse> {
        req.validate()
        
        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")
            
        val messages = when {
            req.type != null && req.round != null -> {
                chatMessageRepository.findByGameAndTypeAndTimestampAfter(
                    game = game,
                    type = req.type,
                    timestamp = Instant.now().minus(30, ChronoUnit.DAYS)
                ).filter { it.game.gCurrentRound == req.round }
            }
            req.type != null -> {
                chatMessageRepository.findByGameAndType(game, req.type)
            }
            req.round != null -> {
                chatMessageRepository.findByGameAndgCurrentRound(game, req.round)
            }
            else -> {
                chatMessageRepository.findByGame(game)
            }
        }
        
        return messages
            .sortedByDescending { it.timestamp }
            .take(req.limit)
            .map { ChatMessageResponse.from(it) }
    }
    
    fun isChatAvailable(game: GameEntity, player: PlayerEntity): Boolean {
        return determineMessageType(game, player) != null
    }
    
    private fun determineMessageType(game: GameEntity, player: PlayerEntity): ChatMessageType? {
        if (!player.isAlive) {
            return null
        }
        
        val players = playerRepository.findByGame(game)
        val currentPhase = determineGamePhase(game, players)

        if (game.gState == GameState.IN_PROGRESS) {
            return when (currentPhase) {
                GamePhase.GIVING_HINTS -> ChatMessageType.HINT
                GamePhase.VOTING_FOR_LIAR -> ChatMessageType.DISCUSSION
                GamePhase.DEFENDING -> ChatMessageType.DEFENSE
                else -> null
            }
        }

        return ChatMessageType.POST_ROUND
    }

    fun isPostRoundChatAvailable(game: GameEntity): Boolean {
        val endTime = postRoundChatWindows[game.gNumber] ?: return false
        return Instant.now().isBefore(endTime)
    }
    

    fun startPostRoundChat(gameNumber: Int) {
        val game = gameRepository.findBygNumber(gameNumber)
            ?: throw RuntimeException("Game not found")

        val endTime = Instant.now().plusSeconds(POST_ROUND_CHAT_DURATION)
        postRoundChatWindows[gameNumber] = endTime

        messagingTemplate.convertAndSend("/topic/chat.status.$gameNumber", mapOf(
            "type" to "POST_ROUND_CHAT_STARTED",
            "gameNumber" to gameNumber,
            "endTime" to endTime.toString()
        ))

        scheduler.schedule({
            stopPostRoundChat(gameNumber)
        }, POST_ROUND_CHAT_DURATION, TimeUnit.SECONDS)
    }

    private fun stopPostRoundChat(gameNumber: Int) {
        postRoundChatWindows.remove(gameNumber)

        messagingTemplate.convertAndSend("/topic/chat.status.$gameNumber", mapOf(
            "type" to "POST_ROUND_CHAT_ENDED",
            "gameNumber" to gameNumber
        ))
    }
    
    private fun determineGamePhase(game: GameEntity, players: List<PlayerEntity>): GamePhase {
        return when (game.gState) {
            GameState.WAITING -> GamePhase.WAITING_FOR_PLAYERS
            GameState.ENDED -> GamePhase.GAME_OVER
            GameState.IN_PROGRESS -> {
                val allPlayersGaveHints = players.all { it.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.GAVE_HINT || !it.isAlive }
                val allPlayersVoted = players.all { it.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.VOTED || !it.isAlive }
                val accusedPlayer = findAccusedPlayer(players)
                
                when {
                    accusedPlayer?.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.ACCUSED -> GamePhase.DEFENDING
                    accusedPlayer?.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.DEFENDED -> GamePhase.VOTING_FOR_SURVIVAL
                    allPlayersVoted -> GamePhase.VOTING_FOR_LIAR
                    allPlayersGaveHints -> GamePhase.VOTING_FOR_LIAR
                    else -> GamePhase.GIVING_HINTS
                }
            }
        }
    }
    
    private fun findAccusedPlayer(players: List<PlayerEntity>): PlayerEntity? {
        return players.find { 
            it.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.ACCUSED || 
            it.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.DEFENDED 
        }
    }
}
