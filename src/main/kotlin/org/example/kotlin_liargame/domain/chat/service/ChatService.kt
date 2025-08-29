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
    private val gameMessagingService: org.example.kotlin_liargame.global.messaging.GameMessagingService,
    @org.springframework.context.annotation.Lazy private val votingService: org.example.kotlin_liargame.domain.game.service.VotingService
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
        
        println("[DEBUG] Message type determined: $messageType")

        val chatMessage = ChatMessageEntity(
            game = game,
            player = player,
            content = sanitizedContent,
            type = messageType
        )
        
        // 채팅 입력 시 게임의 마지막 활동 시간 업데이트 (부재 시간 초기화)
        game.lastActivityAt = java.time.Instant.now()
        gameRepository.save(game)

        val savedMessage = chatMessageRepository.save(chatMessage)

        // 힌트 입력 시 자동으로 다음 턴으로 진행
        val currentPhase = determineGamePhase(game, allPlayers)
        println("[DEBUG] Current phase: $currentPhase, Message type: $messageType")
        println("[DEBUG] Game state: ${game.gameState}, Current player ID: ${game.currentPlayerId}, Player ID: ${player.id}")

        if (messageType == ChatMessageType.HINT &&
            game.gameState == GameState.IN_PROGRESS &&
            currentPhase == GamePhase.SPEECH &&
            game.currentPlayerId == player.id) {

            println("[DEBUG] All conditions met for turn progression - Processing hint from current player ${player.nickname}")

            // 플레이어 상태를 힌트 제공 완료로 변경
            player.state = org.example.kotlin_liargame.domain.game.model.enum.PlayerState.GAVE_HINT
            playerRepository.save(player)

            // 다음 턴으로 진행
            try {
                proceedToNextTurn(game)
                println("[DEBUG] Successfully proceeded to next turn")
            } catch (e: Exception) {
                println("[ERROR] Failed to proceed to next turn: ${e.message}")
                e.printStackTrace()
            }
        } else {
            println("[DEBUG] Conditions not met for turn progression:")
            println("[DEBUG] - Is HINT message: ${messageType == ChatMessageType.HINT}")
            println("[DEBUG] - Game IN_PROGRESS: ${game.gameState == GameState.IN_PROGRESS}")
            println("[DEBUG] - Phase SPEECH: ${currentPhase == GamePhase.SPEECH}")
            println("[DEBUG] - Is current player: ${game.currentPlayerId == player.id}")
        }

        return ChatMessageResponse.from(savedMessage)
    }

    private fun proceedToNextTurn(game: GameEntity) {
        // 현재 턴 인덱스 증가
        game.currentTurnIndex += 1

        val turnOrder = game.turnOrder?.split(',') ?: emptyList()

        // 모든 플레이어가 힌트를 제공했거나 턴이 끝난 경우 투표 단계로 진행
        if (game.currentTurnIndex >= turnOrder.size) {
            println("[DEBUG] All players completed hints (currentTurnIndex: ${game.currentTurnIndex}, turnOrder.size: ${turnOrder.size})")
            println("[DEBUG] Starting voting phase...")

            try {
                // 주입받은 VotingService 직접 사용
                votingService.startVotingPhase(game)
                println("[DEBUG] Successfully started voting phase")

                // 투표 시작 시스템 메시지를 딜레이와 함께 전송
                scheduler.schedule({
                    try {
                        sendSystemMessage(game, "🗳️ 투표 단계가 시작되었습니다! 라이어라고 생각하는 플레이어에게 투표해주세요.")
                        println("[DEBUG] Voting phase start message sent")
                    } catch (e: Exception) {
                        println("[ERROR] Failed to send voting start message: ${e.message}")
                    }
                }, 1000, TimeUnit.MILLISECONDS) // 1초 딜레이

            } catch (e: Exception) {
                println("[ERROR] Failed to start voting phase: ${e.message}")
                e.printStackTrace()
            }
            return
        }

        // 다음 플레이어의 턴 시작
        val nextPlayerNickname = turnOrder[game.currentTurnIndex]
        val players = playerRepository.findByGame(game)
        val nextPlayer = players.find { it.nickname == nextPlayerNickname }

        if (nextPlayer != null) {
            game.currentPlayerId = nextPlayer.id
            game.turnStartedAt = Instant.now()
            game.phaseEndTime = Instant.now().plusSeconds(gameProperties.turnTimeoutSeconds)
            gameRepository.save(game)

            // 메시지 전송 순서를 보장하기 위해 약간의 지연 추가
            scheduler.schedule({
                try {
                    sendSystemMessage(game, "🎯 ${nextPlayer.nickname}님의 차례입니다! 힌트를 말해주세요. (${gameProperties.turnTimeoutSeconds}초)")
                    println("[DEBUG] Next turn message sent for ${nextPlayer.nickname}")
                } catch (e: Exception) {
                    println("[ERROR] Failed to send turn start message: ${e.message}")
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
        println("[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===")
        println("[ChatService] Player: ${player.nickname} (ID: ${player.id})")
        println("[ChatService] Player isAlive: ${player.isAlive}")
        println("[ChatService] Game state: ${game.gameState}")
        println("[ChatService] Game currentPlayerId: ${game.currentPlayerId}")
        println("[ChatService] Game turnStartedAt: ${game.turnStartedAt}")

        if (!player.isAlive) {
            println("[ChatService] Player is not alive, returning null")
            return null
        }
        
        val players = playerRepository.findByGame(game)
        val currentPhase = determineGamePhase(game, players)
        println("[ChatService] Current phase: $currentPhase")

        if (game.gameState == GameState.IN_PROGRESS) {
            return when (currentPhase) {
                GamePhase.SPEECH -> {
                    println("[ChatService] In SPEECH phase")
                    println("[ChatService] Current player ID: ${game.currentPlayerId}")
                    println("[ChatService] Is current player: ${game.currentPlayerId == player.id}")

                    // SPEECH 페이즈에서는 현재 턴인 플레이어만 채팅 가능하고, 아직 힌트를 제공하지 않은 경우에만
                    if (game.currentPlayerId == player.id) {
                        println("[ChatService] Player is current turn player")

                        // 이미 힌트를 제공했는지 확인
                        val existingHint = chatMessageRepository.findTopByGameAndPlayerAndTypeOrderByTimestampDesc(
                            game, player, ChatMessageType.HINT
                        )
                        println("[ChatService] Existing hint: $existingHint")

                        // 현재 턴에서 이미 힌트를 제공했는지 확인 (턴이 시작된 이후에 힌트가 있는지)
                        val hasProvidedHintInCurrentTurn = existingHint != null &&
                            game.turnStartedAt != null &&
                            existingHint.timestamp.isAfter(game.turnStartedAt)

                        println("[ChatService] Has provided hint in current turn: $hasProvidedHintInCurrentTurn")

                        if (hasProvidedHintInCurrentTurn) {
                            println("[ChatService] Already provided hint, returning null")
                            // 이미 힌트를 제공했으면 채팅 불가
                            null
                        } else {
                            println("[ChatService] Can provide hint, returning HINT")
                            ChatMessageType.HINT
                        }
                    } else {
                        println("[ChatService] Not current turn player, returning null")
                        // 현재 턴이 아닌 플레이어는 채팅 불가
                        null
                    }
                }
                GamePhase.VOTING_FOR_LIAR -> {
                    println("[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI")
                    // 투표 단계에서는 채팅이 아닌 투표 UI가 표시되어야 하므로 null 반환
                    null
                }
                GamePhase.DEFENDING -> {
                    println("[ChatService] In DEFENDING phase, returning DEFENSE")
                    ChatMessageType.DEFENSE
                }
                else -> {
                    println("[ChatService] In phase $currentPhase, returning null")
                    null
                }
            }
        }

        println("[ChatService] Game not in progress, returning POST_ROUND")
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
        println("[ChatService] Attempting to send system message to game ${game.gameNumber}: $message")

        val systemMessage = ChatMessageEntity(
            game = game,
            player = null, // 시스템 메시지는 플레이어가 없음
            content = message,
            type = ChatMessageType.SYSTEM
        )

        val savedMessage = chatMessageRepository.save(systemMessage)
        println("[ChatService] System message saved to database with ID: ${savedMessage.id}")

        val response = ChatMessageResponse.from(savedMessage)
        val topicName = "/topic/chat.${game.gameNumber}"

        try {
            messagingTemplate.convertAndSend(topicName, response)
            println("[ChatService] System message sent via WebSocket to topic: $topicName")
        } catch (e: Exception) {
            println("[ChatService] ERROR: Failed to send WebSocket message to $topicName: ${e.message}")
            e.printStackTrace()
            throw e
        }

        println("[ChatService] System message sent successfully to game ${game.gameNumber}: $message")
    }

    private fun determineGamePhase(game: GameEntity, players: List<PlayerEntity>): GamePhase {
        // 게임의 실제 currentPhase 값을 우선적으로 사용
        // 플레이어 상태 기반 추측은 fallback으로만 사용
        return when (game.gameState) {
            GameState.WAITING -> GamePhase.WAITING_FOR_PLAYERS
            GameState.ENDED -> GamePhase.GAME_OVER
            GameState.IN_PROGRESS -> {
                // 실제 게임의 currentPhase가 설정되어 있다면 그것을 사용
                if (game.currentPhase != null) {
                    println("[ChatService] Using actual game currentPhase: ${game.currentPhase}")
                    return game.currentPhase
                }

                // currentPhase가 null인 경우에만 플레이어 상태로 추측 (fallback)
                println("[ChatService] Game currentPhase is null, falling back to player state analysis")
                val allPlayersGaveHints = players.all { it.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.GAVE_HINT || !it.isAlive }
                val allPlayersVoted = players.all { it.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.VOTED || !it.isAlive }
                val accusedPlayer = findAccusedPlayer(players)
                
                when {
                    accusedPlayer?.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.ACCUSED -> GamePhase.DEFENDING
                    accusedPlayer?.state == org.example.kotlin_liargame.domain.game.model.enum.PlayerState.DEFENDED -> GamePhase.VOTING_FOR_SURVIVAL
                    allPlayersVoted -> GamePhase.VOTING_FOR_LIAR
                    allPlayersGaveHints -> GamePhase.VOTING_FOR_LIAR
                    else -> GamePhase.SPEECH  // GIVING_HINTS 대신 SPEECH 사용
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
