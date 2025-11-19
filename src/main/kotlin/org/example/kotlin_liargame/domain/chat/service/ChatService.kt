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
import org.slf4j.LoggerFactory
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
    private val gameMessagingService: org.example.kotlin_liargame.global.messaging.GameMessagingService,
    private val sessionUtil: org.example.kotlin_liargame.global.util.SessionUtil,
    @org.springframework.context.annotation.Lazy private val votingService: org.example.kotlin_liargame.domain.game.service.VotingService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
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

        // HTTP 세션 참조를 먼저 가져오기
        val httpSession = sessionAttributes?.get("HTTP.SESSION") as? HttpSession

        // WebSocket 세션에서 userId를 찾을 수 없는 경우 HTTP 세션에서 찾기
        if (userId == null) {
            if (httpSession != null) {
                // JSON 직렬화 방식으로 사용자 ID 조회
                userId = sessionUtil.getUserId(httpSession)
                logger.debug("Using userId from HTTP session (JSON): {}", userId)
            }
        }

        // WebSocketSessionManager에서 userId 찾기
        if (userId == null && webSocketSessionId != null) {
            userId = webSocketSessionManager.getUserId(webSocketSessionId)
            logger.debug("Using userId from WebSocketSessionManager: {}", userId)

            // WebSocket 세션에 사용자 정보가 없는 경우 HTTP 세션로부터 갱신 시도
            if (userId == null && httpSession != null) {
                logger.debug("Attempting to refresh WebSocket session info...")
                webSocketSessionManager.refreshSessionInfo(webSocketSessionId, httpSession)
                userId = webSocketSessionManager.getUserId(webSocketSessionId)
                logger.debug("After refresh, userId from WebSocketSessionManager: {}", userId)
            }
        }

        // 디버깅: WebSocket 메시지의 세션 정보
        logger.debug("WebSocket message: sessionAttributes = {}, sessionId = {}", sessionAttributes?.keys, webSocketSessionId)
        sessionAttributes?.forEach { (key, value) ->
            logger.debug("Session attribute: {} = {}", key, value)
        }

        // HTTP 세션 값 확인 (JSON 직렬화 방식)
        if (httpSession != null) {
            val httpUserId = sessionUtil.getUserId(httpSession)
            val httpNickname = sessionUtil.getUserNickname(httpSession)
            logger.debug("HTTP Session values (JSON) - userId: {}, nickname: {}", httpUserId, httpNickname)

            if (userId == null) {
                userId = httpUserId
                logger.debug("Using userId from HTTP session (JSON): {}", userId)
            }
        }

        // 싱글 플레이어 게임의 경우 userId 자동 결정
        if (userId == null) {
            val game = gameRepository.findByGameNumber(req.gameNumber)
            if (game != null) {
                val players = playerRepository.findByGame(game)
                if (players.size == 1) {
                    userId = players.first().userId
                    logger.debug("Single player game, using userId: {}", userId)
                } else {
                    logger.debug("Multiple players in game, cannot determine user without authentication")
                }
            }
        }

        if (userId == null) {
            // 인증 실패 시 더 상세한 오류 정보
            logger.error("WebSocket authentication failed. Session attributes available: {}", sessionAttributes?.keys)
            logger.error("WebSocketSessionId: {}", webSocketSessionId)
            logger.error("HTTP Session userId (JSON): {}", httpSession?.let { sessionUtil.getUserId(it) })
            throw RuntimeException("Not authenticated via WebSocket")
        }

        logger.debug("WebSocket message authenticated for userId: {}", userId)

        // WebSocketSessionManager에서 플레이어의 현재 게임 번호 확인
        val playerCurrentGame = webSocketSessionManager.getPlayerGame(userId)
        if (playerCurrentGame != null && playerCurrentGame != req.gameNumber) {
            logger.warn("Player {} is trying to send message to game {}, but is registered in game {}", userId, req.gameNumber, playerCurrentGame)
            // 플레이어의 현재 게임으로 메시지 전송하도록 gameNumber 업데이트
            val correctedRequest = SendChatMessageRequest(
                gameNumber = playerCurrentGame,
                content = req.content,
                playerNickname = req.playerNickname
            )
            return sendMessageWithUserId(correctedRequest, userId)
        }

        return sendMessageWithUserId(req, userId)
    }
    
    private fun sendMessageWithUserId(req: SendChatMessageRequest, userId: Long): ChatMessageResponse {
        // 욕설 필터링
        val approvedWords = profanityService.getApprovedWords()
        val lowerContent = req.content.lowercase()
        if (approvedWords.any { lowerContent.contains(it) }) {
            throw IllegalArgumentException("메시지에 부적절한 단어가 포함되어 있습니다.")
        }

        // 메시지 내용 검증 및 sanitize
        if (!req.isValidLength()) {
            throw IllegalArgumentException("메시지 길이가 유효하지 않습니다.")
        }

        val sanitizedContent = req.getSanitizedContent()

        logger.debug("Looking for game with gameNumber: {}", req.gameNumber)
        val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")
        
        logger.debug("Found game: {} (ID: {})", game.gameName, game.id)

        // 게임의 모든 플레이어 조회하여 디버깅
        val allPlayers = playerRepository.findByGame(game)
        logger.debug("All players in game {}:", req.gameNumber)
        allPlayers.forEach { player ->
            logger.debug("  - Player userId={} (pk={}), Nickname={}", player.userId, player.id, player.nickname)
        }

        logger.debug("Looking for player with userId: {} in game: {}", userId, req.gameNumber)
        val player = playerRepository.findByGameAndUserId(game, userId)

        if (player == null) {
            logger.error("Player not found! userId: {}, gameNumber: {}", userId, req.gameNumber)
            logger.error("Available players in this game:")
            allPlayers.forEach { p ->
                logger.error("  - UserId: {}, Nickname: {}", p.userId, p.nickname)
            }
            throw RuntimeException("You are not in this game")
        }

        logger.debug("Found player: {} (userId={}, pk={})", player.nickname, player.userId, player.id)

        val messageType = determineMessageType(game, player)
            ?: throw RuntimeException("Chat not available")
        
        logger.debug("Message type determined: {}", messageType)

        val chatMessage = ChatMessageEntity(
            game = game,
            player = player,
            content = sanitizedContent,
            type = messageType
        )
        
        // 채팅 입력 시 게임의 마지막 활동 시간 업데이트 (부재 시간 초기화)
        game.lastActivityAt = Instant.now()

        val savedMessage = chatMessageRepository.save(chatMessage)

        // 힌트 입력 시 자동으로 다음 턴으로 진행
        val currentPhase = determineGamePhase(game, allPlayers)
        logger.debug("Current phase: {}, Message type: {}", currentPhase, messageType)
        logger.debug("Game state: {}, Current player userId: {}, Player userId: {}", game.gameState, game.currentPlayerId, player.userId)

        if (messageType == ChatMessageType.HINT &&
            game.gameState == GameState.IN_PROGRESS &&
            currentPhase == GamePhase.SPEECH &&
            game.currentPlayerId == player.userId) {

            logger.debug("All conditions met for turn progression - Processing hint from current player {}", player.nickname)

            // 플레이어 상태를 힌트 제공 완료로 변경
            player.state = org.example.kotlin_liargame.domain.game.model.enum.PlayerState.GAVE_HINT
            playerRepository.save(player)

            // 다음 턴으로 진행
            try {
                proceedToNextTurn(game)
                logger.debug("Successfully proceeded to next turn")
            } catch (e: Exception) {
                logger.error("Failed to proceed to next turn: {}", e.message, e)
            }
        } else {
            logger.debug("Conditions not met for turn progression:")
            logger.debug("- Is HINT message: {}", messageType == ChatMessageType.HINT)
            logger.debug("- Game IN_PROGRESS: {}", game.gameState == GameState.IN_PROGRESS)
            logger.debug("- Phase SPEECH: {}", currentPhase == GamePhase.SPEECH)
            logger.debug("- Is current player: {}", game.currentPlayerId == player.userId)
        }

        return ChatMessageResponse.from(savedMessage)
    }

    private fun proceedToNextTurn(game: GameEntity) {
        // 현재 턴 인덱스 증가
        game.currentTurnIndex += 1

        val turnOrder = game.turnOrder?.split(',') ?: emptyList()

        // 모든 플레이어가 힌트를 제공했거나 턴이 끝난 경우 투표 단계로 진행
        if (game.currentTurnIndex >= turnOrder.size) {
            logger.debug("All players completed hints (currentTurnIndex: {}, turnOrder.size: {})", game.currentTurnIndex, turnOrder.size)
            logger.debug("Starting voting phase...")

            try {
                // 주입받은 VotingService 직접 사용
                votingService.startVotingPhase(game)
                logger.debug("Successfully started voting phase")

                // 투표 시작 시스템 메시지를 딜레이와 함께 전송
                scheduler.schedule({
                    try {
                        sendSystemMessage(game, "🗳️ 투표 단계가 시작되었습니다! 라이어라고 생각하는 플레이어에게 투표해주세요.")
                        logger.debug("Voting phase start message sent")
                    } catch (e: Exception) {
                        logger.error("Failed to send voting start message: {}", e.message)
                    }
                }, 1000, TimeUnit.MILLISECONDS) // 1초 딜레이

            } catch (e: Exception) {
                logger.error("Failed to start voting phase: {}", e.message, e)
            }
            return
        }

        // 다음 플레이어의 차례 시작
        val nextPlayerNickname = turnOrder[game.currentTurnIndex]
        val players = playerRepository.findByGame(game)
        val nextPlayer = players.find { it.nickname == nextPlayerNickname }

        if (nextPlayer != null) {
            game.currentPlayerId = nextPlayer.userId
            game.turnStartedAt = Instant.now()
            game.phaseEndTime = Instant.now().plusSeconds(gameProperties.turnTimeoutSeconds)
            gameRepository.save(game)

            // 메시지 전송 순서를 보장하기 위해 약간의 지연 추가
            scheduler.schedule({
                try {
                    sendSystemMessage(game, "🎯 ${nextPlayer.nickname}님의 차례입니다! 힌트를 말해주세요. (${gameProperties.turnTimeoutSeconds}초)")
                    logger.debug("Next turn message sent for {}", nextPlayer.nickname)
                } catch (e: Exception) {
                    logger.error("Failed to send turn start message: {}", e.message)
                }
            }, 500, TimeUnit.MILLISECONDS) // 500ms 지연
        }
    }



    @Transactional
    fun sendMessage(req: SendChatMessageRequest, session: HttpSession): ChatMessageResponse {
        val userId = sessionService.getCurrentUserId(session)
        return sendMessageWithUserId(req, userId)
    }

    @Transactional(readOnly = true)
    fun getChatHistory(req: GetChatHistoryRequest): List<ChatMessageResponse> {
        logger.debug("========== getChatHistory Debug Start ==========")
        logger.debug("Request: gameNumber={}, type={}, limit={}", req.gameNumber, req.type, req.limit)
        
        val game = gameRepository.findByGameNumber(req.gameNumber)
        if (game == null) {
            logger.error("Game not found for gameNumber: {}", req.gameNumber)
            throw RuntimeException("Game not found")
        }
        
        logger.debug("Found game: '{}' (ID: {}, State: {})", game.gameName, game.id, game.gameState)
        
        // 해당 게임의 모든 플레이어 조회
        val allPlayers = playerRepository.findByGame(game)
        logger.debug("Players in game {}:", req.gameNumber)
        allPlayers.forEach { player ->
            logger.debug("  - Player: {} (userId={}, pk={})", player.nickname, player.userId, player.id)
        }
        
        // 해당 게임의 모든 채팅 메시지 조회 (필터 없이)
        val allMessages = chatMessageRepository.findByGame(game)
        logger.debug("All messages in database for game {}: {}", req.gameNumber, allMessages.size)
        allMessages.forEach { msg ->
            logger.debug("  - Message ID: {}, Player: {}, Content: '{}', Type: {}, Time: {}", msg.id, msg.player?.nickname ?: "SYSTEM", msg.content, msg.type, msg.timestamp)
        }
        
        // 필터링 적용
        val filteredMessages = when {
            req.type != null -> {
                logger.debug("Filtering by type: {}", req.type)
                allMessages.filter { it.type == req.type }
            }
            else -> {
                logger.debug("No type filter applied")
                allMessages
            }
        }
        
        logger.debug("Messages after filtering: {}", filteredMessages.size)
        
        val result = filteredMessages
            .sortedByDescending { it.timestamp }
            .take(req.limit)
            .map { ChatMessageResponse.from(it) }
            
        logger.debug("Final result: {} messages", result.size)
        result.forEach { msg ->
            logger.debug("  - Response: ID={}, Player={}, Content='{}'", msg.id, msg.playerNickname, msg.content)
        }
        logger.debug("========== getChatHistory Debug End ==========")
        
        return result
    }
    
    fun isChatAvailable(game: GameEntity, player: PlayerEntity): Boolean {
        return determineMessageType(game, player) != null
    }
    
    private fun determineMessageType(game: GameEntity, player: PlayerEntity): ChatMessageType? {
        logger.debug("=== DETERMINE MESSAGE TYPE DEBUG ===")
        logger.debug("Player DB pk: {} (userId={})", player.id, player.userId)
        logger.debug("Player nickname: {}", player.nickname)
        logger.debug("Player isAlive: {}", player.isAlive)
        logger.debug("Game state: {}", game.gameState)
        logger.debug("Game currentPlayerId: {}", game.currentPlayerId)
        logger.debug("Game turnStartedAt: {}", game.turnStartedAt)

        if (!player.isAlive) {
            logger.debug("Player is not alive, returning null")
            return null
        }
        
        val players = playerRepository.findByGame(game)
        val currentPhase = determineGamePhase(game, players)
        logger.debug("Current phase: {}", currentPhase)

        if (game.gameState == GameState.IN_PROGRESS) {
            return when (currentPhase) {
                GamePhase.SPEECH -> {
                    logger.debug("In SPEECH phase")
                    logger.debug("Current player ID: {}", game.currentPlayerId)
                    logger.debug("Is current player: {}", game.currentPlayerId == player.userId)

                    // SPEECH 페이즈에서는 현재 턴인 플레이어만 채팅 가능하고, 아직 힌트를 제공하지 않은 경우에만
                    if (game.currentPlayerId == player.userId) {
                        logger.debug("Player is current turn player")

                        // 이미 힌트를 제공했는지 확인
                        val existingHint = chatMessageRepository.findTopByGameAndPlayerAndTypeOrderByTimestampDesc(
                            game, player, ChatMessageType.HINT
                        )
                        logger.debug("Existing hint: {}", existingHint)

                        // 현재 턴에서 이미 힌트를 제공했는지 확인 (턴이 시작된 이후에 힌트가 있는지)
                        val hasProvidedHintInCurrentTurn = existingHint != null &&
                            game.turnStartedAt != null &&
                            existingHint.timestamp.isAfter(game.turnStartedAt)

                        logger.debug("Has provided hint in current turn: {}", hasProvidedHintInCurrentTurn)

                        if (hasProvidedHintInCurrentTurn) {
                            logger.debug("Already provided hint, returning null")
                            // 이미 힌트를 제공했으면 채팅 불가
                            null
                        } else {
                            logger.debug("Can provide hint, returning HINT")
                            ChatMessageType.HINT
                        }
                    } else {
                        logger.debug("Not current turn player, returning null")
                        // 현재 턴이 아닌 플레이어는 채팅 불가
                        null
                    }
                }
                GamePhase.VOTING_FOR_LIAR -> {
                    logger.debug("In VOTING_FOR_LIAR phase, returning null to enable voting UI")
                    // 투표 단계에서는 채팅이 아닌 투표 UI가 표시되어야 하므로 null 반환
                    null
                }
                GamePhase.DEFENDING -> {
                    logger.debug("In DEFENDING phase")
                    // 모든 플레이어가 DEFENDING 단계에서 채팅 가능
                    // 변론자 메시지는 DEFENSE 타입, 다른 플레이어는 DISCUSSION 타입
                    if (game.accusedPlayerId == player.userId) {
                        logger.debug("Player is accused, returning DEFENSE")
                        ChatMessageType.DEFENSE
                    } else {
                        logger.debug("Player is not accused, returning DISCUSSION")
                        ChatMessageType.DISCUSSION
                    }
                }
                GamePhase.VOTING_FOR_SURVIVAL -> {
                    logger.debug("In VOTING_FOR_SURVIVAL phase, chat disabled")
                    // 최종 투표 단계에서는 채팅 비활성화
                    null
                }
                GamePhase.GUESSING_WORD -> {
                    logger.debug("In GUESSING_WORD phase")
                    // 라이어 추측 단계에서는 라이어만 채팅 가능
                    if (player.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR) {
                        logger.debug("Player is liar, returning DISCUSSION")
                        ChatMessageType.DISCUSSION
                    } else {
                        logger.debug("Player is not liar, chat disabled")
                        null
                    }
                }
                else -> {
                    logger.debug("In phase {}, returning null", currentPhase)
                    null
                }
            }
        }

        logger.debug("Game not in progress, returning WAITING_ROOM")
        return ChatMessageType.WAITING_ROOM
    }

    fun isPostRoundChatAvailable(game: GameEntity): Boolean {
        val endTime = gameStateService.getPostRoundChatWindow(game.gameNumber) ?: return false
        return Instant.now().isBefore(endTime)
    }
    

    fun startPostRoundChat(gameNumber: Int) {
        gameRepository.findByGameNumber(gameNumber)
            ?: throw RuntimeException("Game not found")

        val endTime = Instant.now().plusSeconds(gameProperties.postRoundChatDurationSeconds)

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
    

    @Transactional
    fun sendSystemMessage(game: GameEntity, message: String) {
        logger.debug("Attempting to send system message to game {}: {}", game.gameNumber, message)

        val systemMessage = ChatMessageEntity(
            game = game,
            player = null, // 시스템 메시지는 플레이어가 없음
            content = message,
            type = ChatMessageType.SYSTEM,
            playerUserId = null,
            playerNicknameSnapshot = "SYSTEM"
        )

        val savedMessage = chatMessageRepository.save(systemMessage)
        logger.debug("System message saved to database with ID: {}", savedMessage.id)

        val response = ChatMessageResponse.from(savedMessage)
        val topicName = "/topic/chat.${game.gameNumber}"

        try {
            messagingTemplate.convertAndSend(topicName, response)
            logger.debug("System message sent via WebSocket to topic: {}", topicName)
        } catch (e: Exception) {
            logger.error("Failed to send WebSocket message to {}: {}", topicName, e.message, e)
            throw e
        }

        logger.debug("System message sent successfully to game {}: {}", game.gameNumber, message)
    }

    private fun determineGamePhase(game: GameEntity, @Suppress("UNUSED_PARAMETER") players: List<PlayerEntity>): GamePhase {
        // 게임의 실제 currentPhase 값을 우선적으로 사용
        // 플레이어 상태 기반 추측 fallback으로만 사용
        return when (game.gameState) {
            GameState.WAITING -> GamePhase.WAITING_FOR_PLAYERS
            GameState.ENDED -> GamePhase.GAME_OVER
            GameState.IN_PROGRESS -> {
                // 실제 게임의 currentPhase가 설정되어 있으므로 그것을 사용
                logger.debug("Using actual game currentPhase: {}", game.currentPhase)
                return game.currentPhase
            }
        }
    }
    
    private fun findAccusedPlayer(players: List<PlayerEntity>): PlayerEntity? {
        return players.find { 
            it.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.ACCUSED || 
            it.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.DEFENDED 
        }
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    fun archivePlayerChatMessages(userId: Long, nickname: String?): Int {
        val snapshotName = nickname?.takeIf { it.isNotBlank() } ?: "퇴장한 플레이어"

        // Ensure we retain identifying metadata before detaching the relation
        chatMessageRepository.snapshotPlayerMetadata(userId, snapshotName)

        val updated = chatMessageRepository.detachPlayerByUserId(userId)
        if (updated == 0) {
            logger.debug("No chat messages required archiving for player userId: {}", userId)
        } else {
            logger.info("Archived {} chat messages for player userId: {}", updated, userId)
        }
        return updated
    }

    @Transactional
    fun deleteGameChatMessages(game: GameEntity): Int {
        return try {
            val deletedCount = chatMessageRepository.deleteByGame(game)
            logger.info("Deleted {} chat messages for game: {}", deletedCount, game.gameNumber)
            deletedCount
        } catch (e: Exception) {
            logger.error("Failed to delete chat messages for game: {} - {}", game.gameNumber, e.message)
            0
        }
    }
}
