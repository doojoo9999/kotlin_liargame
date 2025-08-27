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
import org.example.kotlin_liargame.domain.profanity.service.ProfanityService
import org.example.kotlin_liargame.tools.websocket.WebSocketSessionManager
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

@Service
class ChatService(
    private val chatMessageRepository: ChatMessageRepository,
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val webSocketSessionManager: WebSocketSessionManager,
    private val profanityService: ProfanityService,
    private val gameProperties: org.example.kotlin_liargame.global.config.GameProperties,
    private val gameStateService: org.example.kotlin_liargame.global.redis.GameStateService,
    private val sessionService: org.example.kotlin_liargame.global.session.SessionService,
    private val gameMessagingService: org.example.kotlin_liargame.global.messaging.GameMessagingService
) {
    private val scheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(1)

    // WebSocket용 별도 메서드
    @Transactional
    fun sendMessageViaWebSocket(
        req: SendChatMessageRequest, 
        sessionAttributes: Map<String, Any>?,
        webSocketSessionId: String?
    ): ChatMessageResponse {
        // 세션에서 userId 추출
        var userId = sessionAttributes?.get("userId") as? Long

        // WebSocket 세션에서 userId를 찾을 수 없는 경우 HTTP 세션에서 찾기
        if (userId == null) {
            val httpSession = sessionAttributes?.get("HTTP.SESSION") as? HttpSession
            if (httpSession != null) {
                userId = httpSession.getAttribute("userId") as? Long
                println("[DEBUG] Using userId from HTTP session: $userId")
            }
        }

        // WebSocketSessionManager에서 userId 찾기
        if (userId == null && webSocketSessionId != null) {
            userId = webSocketSessionManager.getUserId(webSocketSessionId)
            println("[DEBUG] Using userId from WebSocketSessionManager: $userId")
        }

        // 디버깅: WebSocket 메시지의 세션 정보
        println("[DEBUG] WebSocket message: sessionAttributes = ${sessionAttributes?.keys}, sessionId = $webSocketSessionId")
        sessionAttributes?.forEach { (key, value) ->
            println("[DEBUG] Session attribute: $key = $value")
        }

        // HTTP 세션 값 확인
        val httpSession = sessionAttributes?.get("HTTP.SESSION") as? HttpSession
        if (httpSession != null) {
            val httpUserId = httpSession.getAttribute("userId") as? Long
            val httpNickname = httpSession.getAttribute("nickname") as? String
            println("[DEBUG] HTTP Session values - userId: $httpUserId, nickname: $httpNickname")

            if (userId == null) {
                userId = httpUserId
                println("[DEBUG] Using userId from HTTP session: $userId")
            }
        }

        // 싱글 플레이어 게임의 경우 userId 자동 결정
        if (userId == null) {
            val game = gameRepository.findByGameNumber(req.gameNumber)
            if (game != null) {
                val players = playerRepository.findByGame(game)
                if (players.size == 1) {
                    userId = players.first().userId
                    println("[DEBUG] Single player game, using userId: $userId")
                } else {
                    println("[DEBUG] Multiple players in game, cannot determine user without authentication")
                }
            }
        }

        if (userId == null) {
            // 인증 실패 시 더 자세한 오류 정보
            println("[ERROR] WebSocket authentication failed. Session attributes available: ${sessionAttributes?.keys}")
            println("[ERROR] WebSocketSessionId: $webSocketSessionId")
            println("[ERROR] HTTP Session userId: ${httpSession?.getAttribute("userId")}")
            println("[ERROR] WebSocketSessionManager state:")
            webSocketSessionManager.printSessionInfo()
            throw RuntimeException("Not authenticated via WebSocket")
        }

        println("[DEBUG] WebSocket message authenticated for userId: $userId")

        // WebSocketSessionManager에서 플레이어의 현재 게임 번호 확인
        val playerCurrentGame = webSocketSessionManager.getPlayerGame(userId)
        if (playerCurrentGame != null && playerCurrentGame != req.gameNumber) {
            println("[WARN] Player $userId is trying to send message to game ${req.gameNumber}, but is registered in game $playerCurrentGame")
            // 플레이어의 현재 게임으로 메시지 전송하도록 gameNumber 업데이트
            val correctedRequest = SendChatMessageRequest(
                gameNumber = playerCurrentGame,
                content = req.content
            )
            return sendMessageWithUserId(correctedRequest, userId)
        }

        return sendMessageWithUserId(req, userId)
    }
    
    private fun sendMessageWithUserId(req: SendChatMessageRequest, userId: Long): ChatMessageResponse {
        val approvedWords = profanityService.getApprovedWords()
        val lowerContent = req.content.lowercase()
        if (approvedWords.any { lowerContent.contains(it) }) {
            throw IllegalArgumentException("메시지에 부적절한 단어가 포함되어 있습니다.")
        }

        println("[DEBUG] Looking for game with gameNumber: ${req.gameNumber}")
        val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")
        
        println("[DEBUG] Found game: ${game.gameName} (ID: ${game.id})")

        // 게임의 모든 플레이어 조회하여 디버깅
        val allPlayers = playerRepository.findByGame(game)
        println("[DEBUG] All players in game ${req.gameNumber}:")
        allPlayers.forEach { player ->
            println("[DEBUG]   - Player ID: ${player.id}, UserId: ${player.userId}, Nickname: ${player.nickname}")
        }

        println("[DEBUG] Looking for player with userId: $userId in game: ${req.gameNumber}")
        val player = playerRepository.findByGameAndUserId(game, userId)

        if (player == null) {
            println("[ERROR] Player not found! userId: $userId, gameNumber: ${req.gameNumber}")
            println("[ERROR] Available players in this game:")
            allPlayers.forEach { p ->
                println("[ERROR]   - UserId: ${p.userId}, Nickname: ${p.nickname}")
            }
            throw RuntimeException("You are not in this game")
        }

        println("[DEBUG] Found player: ${player.nickname} (ID: ${player.id})")

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
        val userId = sessionService.getCurrentUserId(session)
        return sendMessageWithUserId(req, userId)
    }

    @Transactional(readOnly = true)
    fun getChatHistory(req: GetChatHistoryRequest): List<ChatMessageResponse> {
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
            println("[DEBUG]   - Message ID: ${msg.id}, Player: ${msg.player?.nickname ?: "SYSTEM"}, Content: '${msg.content}', Type: ${msg.type}, Time: ${msg.timestamp}")
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
        val endTime = gameStateService.getPostRoundChatWindow(game.gameNumber) ?: return false
        return Instant.now().isBefore(endTime)
    }
    

    fun startPostRoundChat(gameNumber: Int) {
        gameRepository.findByGameNumber(gameNumber)
            ?: throw RuntimeException("Game not found")

        val endTime = Instant.now().plusSeconds(gameProperties.postRoundChatDurationSeconds)

        // Redis에 상태 저장
        gameStateService.setPostRoundChatWindow(gameNumber, endTime)

        gameMessagingService.sendChatStatusUpdate(gameNumber, "POST_ROUND_CHAT_STARTED", mapOf(
            "endTime" to endTime.toString()
        ))

        scheduler.schedule({
            stopPostRoundChat(gameNumber)
        }, gameProperties.postRoundChatDurationSeconds, TimeUnit.SECONDS)
    }

    private fun stopPostRoundChat(gameNumber: Int) {
        gameStateService.removePostRoundChatWindow(gameNumber)
        gameMessagingService.sendChatStatusUpdate(gameNumber, "POST_ROUND_CHAT_ENDED")
    }
    
    /**
     * 시스템 메시지 전송 (사회자 메시지, 게임 상태 변화 알림 등)
     */
    @Transactional
    fun sendSystemMessage(game: GameEntity, message: String) {
        val systemMessage = ChatMessageEntity(
            game = game,
            player = null, // 시스템 메시지는 플레이어가 없음
            content = message,
            type = ChatMessageType.SYSTEM
        )

        val savedMessage = chatMessageRepository.save(systemMessage)
        val response = ChatMessageResponse.from(savedMessage)

        // WebSocket으로 모든 게임 참가자에게 실시간 전송
        messagingTemplate.convertAndSend("/topic/chat.${game.gameNumber}", response)

        println("[DEBUG] System message sent to game ${game.gameNumber}: $message")
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

    /**
     * 플레이어의 모든 채팅 메시지를 삭제합니다.
     * 외래 키 제약 조건 위반을 방지하기 위해 플레이어 삭제 전에 호출되어야 합니다.
     */
    @Transactional
    fun deletePlayerChatMessages(playerId: Long): Int {
        return try {
            val deletedCount = chatMessageRepository.deleteByPlayerId(playerId)
            println("[CHAT] Deleted $deletedCount chat messages for player ID: $playerId")
            deletedCount
        } catch (e: Exception) {
            println("[ERROR] Failed to delete chat messages for player ID: $playerId - ${e.message}")
            0
        }
    }

    /**
     * 게임의 모든 채팅 메시지를 삭제합니다.
     * 외래 키 제약 조건 위반을 방지하기 위해 게임 삭제 전에 호출되어야 합니다.
     */
    @Transactional
    fun deleteGameChatMessages(game: GameEntity): Int {
        return try {
            val deletedCount = chatMessageRepository.deleteByGame(game)
            println("[CHAT] Deleted $deletedCount chat messages for game: ${game.gameNumber}")
            deletedCount
        } catch (e: Exception) {
            println("[ERROR] Failed to delete chat messages for game: ${game.gameNumber} - ${e.message}")
            0
        }
    }
}
