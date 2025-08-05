package org.example.kotlin_liargame.domain.chat.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.chat.dto.request.GetChatHistoryRequest
import org.example.kotlin_liargame.domain.chat.dto.request.SendChatMessageRequest
import org.example.kotlin_liargame.domain.chat.dto.response.ChatMessageResponse
import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import org.example.kotlin_liargame.domain.chat.repository.ChatMessageRepository
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.tools.websocket.WebSocketSessionManager
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

@Service
class ChatService(
    private val chatMessageRepository: ChatMessageRepository,
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val webSocketSessionManager: WebSocketSessionManager
) {
    private val postRoundChatWindows = ConcurrentHashMap<Int, Instant>()

    private val scheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(1)

    private val POST_ROUND_CHAT_DURATION = 7L

    fun getCurrentUserId(session: HttpSession): Long {
        return session.getAttribute("userId") as? Long
            ?: throw RuntimeException("Not authenticated")
    }

    // WebSocket용 별도 메서드
    @Transactional
    fun sendMessageViaWebSocket(
        req: SendChatMessageRequest, 
        sessionAttributes: Map<String, Any>?,
        webSocketSessionId: String?
    ): ChatMessageResponse {
        println("[DEBUG] WebSocket message: sessionAttributes = ${sessionAttributes?.keys}, sessionId = $webSocketSessionId")

        // 디버깅을 위해 세션 속성 출력
        sessionAttributes?.forEach { (key, value) ->
            println("[DEBUG] Session attribute: $key = $value")
        }

        // 1차: 세션 속성에서 직접 userId 추출 시도
        var userId = sessionAttributes?.get("userId") as? Long

        // 2차: WebSocketSessionManager를 통한 fallback 인증 시도
        if (userId == null && webSocketSessionId != null) {
            println("[DEBUG] Attempting fallback authentication via WebSocketSessionManager for sessionId: $webSocketSessionId")
            userId = webSocketSessionManager.getUserId(webSocketSessionId)
            if (userId != null) {
                println("[DEBUG] Found userId via WebSocketSessionManager: $userId")
            }
        }

        // 3차: 최후의 수단으로 게임 참가자 중에서 추정 (임시 해결책)
        if (userId == null) {
            println("[WARN] No userId found through normal channels, attempting game-based fallback")
            val game = gameRepository.findByGameNumber(req.gameNumber)
            if (game != null) {
                val players = playerRepository.findByGame(game)
                if (players.size == 1) {
                    // 게임에 플레이어가 1명만 있는 경우, 해당 플레이어로 추정
                    userId = players.first().userId
                    println("[DEBUG] Single player game detected, using userId: $userId")
                } else {
                    println("[DEBUG] Multiple players in game, cannot determine user without authentication")
                }
            }
        }

        if (userId == null) {
            // 인증 실패 시 더 자세한 오류 정보
            println("[ERROR] WebSocket authentication failed. Session attributes available: ${sessionAttributes?.keys}")
            println("[ERROR] WebSocketSessionId: $webSocketSessionId")
            println("[ERROR] WebSocketSessionManager state:")
            webSocketSessionManager.printSessionInfo()
            throw RuntimeException("Not authenticated via WebSocket")
        }

        println("[DEBUG] WebSocket message authenticated for userId: $userId")
        return sendMessageWithUserId(req, userId)
    }
    
    private fun sendMessageWithUserId(req: SendChatMessageRequest, userId: Long): ChatMessageResponse {
        req.validate()
        
        val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")
        
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")
        
        // 기존 로직 유지, 복잡한 JWT 파싱 로직 모두 제거
        val messageType = determineMessageType(game, player)
            ?: throw RuntimeException("Chat not available")
        
        val chatMessage = ChatMessageEntity(
            game = game,
            player = player,
            content = req.content,
            type = messageType
        )
        
        return ChatMessageResponse.from(chatMessageRepository.save(chatMessage))
    }



    @Transactional
    fun sendMessage(req: SendChatMessageRequest, session: HttpSession): ChatMessageResponse {
        req.validate()
        
        val userId = getCurrentUserId(session)
        val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")
        
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")
        
        // 기존 로직 유지, 복잡한 JWT 파싱 로직 모두 제거
        val messageType = determineMessageType(game, player)
            ?: throw RuntimeException("Chat not available")
        
        val chatMessage = ChatMessageEntity(
            game = game,
            player = player,
            content = req.content,
            type = messageType
        )
        
        return ChatMessageResponse.from(chatMessageRepository.save(chatMessage))
    }

    @Transactional(readOnly = true)
    fun getChatHistory(req: GetChatHistoryRequest): List<ChatMessageResponse> {
        req.validate()
        
        println("[DEBUG] ========== getChatHistory Debug Start ==========")
        println("[DEBUG] Request: gameNumber=${req.gameNumber}, type=${req.type}, limit=${req.limit}")
        
        val game = gameRepository.findByGameNumber(req.gameNumber)
        if (game == null) {
            println("[ERROR] Game not found for gameNumber: ${req.gameNumber}")
            throw RuntimeException("Game not found")
        }
        
        println("[DEBUG] Found game: '${game.gameName}' (ID: ${game.id}, State: ${game.gameState})")
        
        // 해당 게임의 모든 플레이어 조회
        val allPlayers = playerRepository.findByGame(game)
        println("[DEBUG] Players in game ${req.gameNumber}:")
        allPlayers.forEach { player ->
            println("[DEBUG]   - Player: ${player.nickname} (ID: ${player.id}, UserId: ${player.userId})")
        }
        
        // 해당 게임의 모든 채팅 메시지 조회 (필터 없이)
        val allMessages = chatMessageRepository.findByGame(game)
        println("[DEBUG] All messages in database for game ${req.gameNumber}: ${allMessages.size}")
        allMessages.forEach { msg ->
            println("[DEBUG]   - Message ID: ${msg.id}, Player: ${msg.player.nickname}, Content: '${msg.content}', Type: ${msg.type}, Time: ${msg.timestamp}")
        }
        
        // 필터링 적용
        val filteredMessages = when {
            req.type != null -> {
                println("[DEBUG] Filtering by type: ${req.type}")
                allMessages.filter { it.type == req.type }
            }
            else -> {
                println("[DEBUG] No type filter applied")
                allMessages
            }
        }
        
        println("[DEBUG] Messages after filtering: ${filteredMessages.size}")
        
        val result = filteredMessages
            .sortedByDescending { it.timestamp }
            .take(req.limit)
            .map { ChatMessageResponse.from(it) }
            
        println("[DEBUG] Final result: ${result.size} messages")
        result.forEach { msg ->
            println("[DEBUG]   - Response: ID=${msg.id}, Player=${msg.playerNickname}, Content='${msg.content}'")
        }
        println("[DEBUG] ========== getChatHistory Debug End ==========")
        
        return result
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

        if (game.gameState == GameState.IN_PROGRESS) {
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
        val endTime = postRoundChatWindows[game.gameNumber] ?: return false
        return Instant.now().isBefore(endTime)
    }
    

    fun startPostRoundChat(gameNumber: Int) {
        val game = gameRepository.findByGameNumber(gameNumber)
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
        return when (game.gameState) {
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
