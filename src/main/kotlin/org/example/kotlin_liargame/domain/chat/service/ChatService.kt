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
import org.example.kotlin_liargame.tools.security.jwt.JwtProvider
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.security.core.context.SecurityContextHolder
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
    private val jwtProvider: JwtProvider
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

    /**
     * JWT 토큰에서 사용자 ID를 추출합니다.
     * WebSocket 연결 시 Authorization 헤더에서 JWT 토큰을 파싱하여 사용자 ID를 반환합니다.
     */
    fun extractUserIdFromJwtToken(jwtToken: String?): Long? {
        if (jwtToken.isNullOrBlank()) {
            println("[DEBUG] JWT token is null or blank")
            return null
        }

        return try {
            // Bearer 접두사 제거
            val token = if (jwtToken.startsWith("Bearer ")) {
                jwtToken.substring(7)
            } else {
                jwtToken
            }

            // 토큰 유효성 검증
            if (!jwtProvider.validateToken(token)) {
                println("[WARN] Invalid JWT token")
                return null
            }

            // 토큰이 데이터베이스에 존재하는지 확인
            if (!jwtProvider.isTokenInDatabase(token)) {
                println("[WARN] JWT token not found in database")
                return null
            }

            // 토큰에서 사용자 ID 추출
            val claims = jwtProvider.getClaims(token)
            val userId = claims.subject.toLongOrNull()
            
            if (userId != null) {
                println("[DEBUG] Successfully extracted userId from JWT: $userId")
            } else {
                println("[WARN] Failed to parse userId from JWT token subject: ${claims.subject}")
            }
            
            userId
        } catch (e: Exception) {
            println("[ERROR] Failed to extract userId from JWT token: ${e.message}")
            null
        }
    }

    /**
     * WebSocket 연결에서 사용자 ID를 가져옵니다.
     * 1. 세션에서 userId 확인
     * 2. 세션에서 JWT 토큰을 파싱하여 userId 추출
     * 3. SecurityContext에서 userId 확인
     * 4. 기본값 반환
     */
    fun getUserIdForWebSocket(sessionUserId: Long?, sessionToken: String?): Long {
        // 1. 세션에서 직접 userId가 제공된 경우
        if (sessionUserId != null) {
            println("[DEBUG] Using session userId: $sessionUserId")
            return sessionUserId
        }

        // 2. 세션에서 JWT 토큰을 파싱하여 userId 추출
        val jwtUserId = extractUserIdFromJwtToken(sessionToken)
        if (jwtUserId != null) {
            println("[DEBUG] Using JWT-extracted userId: $jwtUserId")
            return jwtUserId
        }

        // 3. SecurityContext에서 userId 확인
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication?.principal is UserPrincipal) {
            val userId = (authentication.principal as UserPrincipal).userId
            println("[DEBUG] Using SecurityContext userId: $userId")
            return userId
        }

        // 4. 기본값 반환 (개발/테스트용)
        println("[WARN] No valid authentication found for WebSocket, using default user ID")
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

    /**
     * WebSocket 연결에서 JWT 토큰 인증을 사용하여 메시지를 전송합니다.
     */
    @Transactional
    fun sendMessageWithJwtAuth(req: SendChatMessageRequest, sessionUserId: Long?, sessionToken: String?): ChatMessageResponse {
        req.validate()
        
        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")
        
        // JWT 토큰 인증을 통한 사용자 ID 추출
        val userId = getUserIdForWebSocket(sessionUserId, sessionToken)
        println("[DEBUG] Final userId for WebSocket message: $userId, gameNumber: ${req.gNumber}")
        
        val player = playerRepository.findByGameAndUserId(game, userId)
        
        if (player == null) {
            val allPlayers = playerRepository.findByGame(game)
            println("[DEBUG] Player not found! All players in game ${req.gNumber}:")
            allPlayers.forEach { p ->
                println("[DEBUG]   - Player: ${p.nickname} (ID: ${p.id}, UserId: ${p.userId})")
            }
            println("[DEBUG] Searched for UserId: $userId")
            throw RuntimeException("You are not in this game. UserId: $userId, GameNumber: ${req.gNumber}")
        }

        println("[DEBUG] Found player: ${player.nickname} (ID: ${player.id}, UserId: ${player.userId})")

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
            println("[SUCCESS] Chat message saved to database: ${savedMessage.id}")
            
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
            println("[SUCCESS] Chat message saved to database: ${savedMessage.id}")
            
            return ChatMessageResponse.from(savedMessage)
        }
    }

    @Transactional
    fun sendMessage(req: SendChatMessageRequest, overrideUserId: Long? = null): ChatMessageResponse {
        req.validate()
        
        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")
        val userId = when {
            overrideUserId != null -> {
                println("[DEBUG] Using provided userId: $overrideUserId")
                overrideUserId
            }
            else -> {
                try {
                    val authentication = SecurityContextHolder.getContext().authentication
                    if (authentication != null && authentication.principal is UserPrincipal) {
                        val principal = authentication.principal as UserPrincipal
                        println("[DEBUG] Using SecurityContext userId: ${principal.userId}")
                        principal.userId
                    } else {
                        println("[WARN] No authentication found, using fallback logic")
                        val firstPlayer = playerRepository.findByGame(game).firstOrNull()
                        firstPlayer?.userId ?: throw RuntimeException("No players found in game")
                    }
                } catch (e: Exception) {
                    println("[WARN] Failed to get user from SecurityContext: ${e.message}")
                    val firstPlayer = playerRepository.findByGame(game).firstOrNull()
                    firstPlayer?.userId ?: throw RuntimeException("No players found in game")
                }
            }
        }
        
        println("[DEBUG] Final userId for WebSocket message: $userId, gameNumber: ${req.gNumber}")
        
        val player = playerRepository.findByGameAndUserId(game, userId)
        
        if (player == null) {
            val allPlayers = playerRepository.findByGame(game)
            println("[DEBUG] Player not found! All players in game ${req.gNumber}:")
            allPlayers.forEach { p ->
                println("[DEBUG]   - Player: ${p.nickname} (ID: ${p.id}, UserId: ${p.userId})")
            }
            println("[DEBUG] Searched for UserId: $userId")
            throw RuntimeException("You are not in this game. UserId: $userId, GameNumber: ${req.gNumber}")
        }

        println("[DEBUG] Found player: ${player.nickname} (ID: ${player.id}, UserId: ${player.userId})")

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
            println("[SUCCESS] Chat message saved to database: ${savedMessage.id}")
            
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
            println("[SUCCESS] Chat message saved to database: ${savedMessage.id}")
            
            return ChatMessageResponse.from(savedMessage)
        }
    }

    @Transactional(readOnly = true)
    fun getChatHistory(req: GetChatHistoryRequest): List<ChatMessageResponse> {
        req.validate()
        
        println("[DEBUG] ========== getChatHistory Debug Start ==========")
        println("[DEBUG] Request: gNumber=${req.gNumber}, type=${req.type}, limit=${req.limit}")
        
        val game = gameRepository.findBygNumber(req.gNumber)
        if (game == null) {
            println("[ERROR] Game not found for gNumber: ${req.gNumber}")
            throw RuntimeException("Game not found")
        }
        
        println("[DEBUG] Found game: '${game.gName}' (ID: ${game.id}, State: ${game.gState})")
        
        // 해당 게임의 모든 플레이어 조회
        val allPlayers = playerRepository.findByGame(game)
        println("[DEBUG] Players in game ${req.gNumber}:")
        allPlayers.forEach { player ->
            println("[DEBUG]   - Player: ${player.nickname} (ID: ${player.id}, UserId: ${player.userId})")
        }
        
        // 해당 게임의 모든 채팅 메시지 조회 (필터 없이)
        val allMessages = chatMessageRepository.findByGame(game)
        println("[DEBUG] All messages in database for game ${req.gNumber}: ${allMessages.size}")
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
