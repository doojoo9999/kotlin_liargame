package org.example.kotlin_liargame.domain.game.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.servlet.http.HttpSession
import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.game.dto.request.*
import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.service.*
import org.example.kotlin_liargame.global.exception.GameAlreadyStartedException
import org.example.kotlin_liargame.global.exception.GameNotFoundException
import org.example.kotlin_liargame.global.exception.RoomFullException
import org.example.kotlin_liargame.global.util.ControllerErrorHandler
import org.example.kotlin_liargame.global.util.SessionUtil
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/game")
class GameController(
    private val gameRoomService: GameRoomService,
    private val gamePlayerService: GamePlayerService,
    private val gamePlayService: GamePlayService,
    private val gameProgressService: GameProgressService,
    private val votingService: VotingService,
    private val defenseService: DefenseService,
    private val gameResultService: GameResultService,
    private val recoveryResponseFactory: RecoveryResponseFactory,
    private val sessionUtil: SessionUtil,
    private val errorHandler: ControllerErrorHandler,
    private val webSocketSessionManager: org.example.kotlin_liargame.tools.websocket.WebSocketSessionManager,
    private val playerReadinessService: PlayerReadinessService,
    private val gameCountdownService: GameCountdownService,
    private val enhancedVotingService: EnhancedVotingService,
    private val enhancedConnectionService: org.example.kotlin_liargame.global.connection.service.EnhancedConnectionService,
    private val gameCleanupService: GameCleanupService
) {
    private val logger = org.slf4j.LoggerFactory.getLogger(GameController::class.java)
    
    @PostMapping("/create")
    fun createGameRoom(@Valid @RequestBody request: CreateGameRoomRequest, session: HttpSession): ResponseEntity<Int> {
        val gameNumber = gameRoomService.createGameRoom(request, session)

        // 게임 생성 후 WebSocket 세션 정보 갱신
        refreshAllWebSocketSessions(session)

        return ResponseEntity.ok(gameNumber)
    }

    @PostMapping("/join")
    fun joinGame(@Valid @RequestBody request: JoinGameRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        return try {
            val response = gamePlayerService.joinGame(request, session)

            // 게임 입장 성공 후 WebSocket 세션 정보 갱신
            refreshAllWebSocketSessions(session)

            ResponseEntity.ok(response)
        } catch (e: GameNotFoundException) {
            logger.error("Game not found: {}", e.message)
            ResponseEntity.status(404).body(null)
        } catch (e: GameAlreadyStartedException) {
            logger.error("Game already started: {}", e.message)
            ResponseEntity.status(409).body(null)
        } catch (e: RoomFullException) {
            logger.error("Room is full: {}", e.message)
            ResponseEntity.status(409).body(null)
        } catch (e: RuntimeException) {
            logger.error("Runtime exception during join: {}", e.message, e)
            ResponseEntity.badRequest().body(null)
        } catch (e: Exception) {
            logger.error("Unexpected error during join: {}", e.message, e)
            ResponseEntity.status(500).body(null)
        }
    }


    @PostMapping("/leave")
    fun leaveGame(@Valid @RequestBody request: LeaveGameRequest, session: HttpSession): ResponseEntity<Boolean> {
        return try {
            val response = gamePlayerService.leaveGame(request, session)
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            logger.error("Failed to leave game: {}", e.message)
            ResponseEntity.badRequest().body(null)
        }
    }

    
    @PostMapping("/start")
    fun startGame(session: HttpSession): ResponseEntity<GameStateResponse> {
        return try {
            val gameState = gameProgressService.startGame(session)
            ResponseEntity.ok(gameState)
        } catch (e: Exception) {
            logger.error("Failed to start game: {}", e.message)
            ResponseEntity.badRequest().body(null)
        }
    }

    @PostMapping("/hint")
    fun giveHint(@Valid @RequestBody request: GiveHintRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        return try {
            val response = gameProgressService.giveHint(request, session)
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            val status = errorHandler.getStatusForException(e)
            ResponseEntity.status(status).body(null)
        }
    }

    @PostMapping("/vote")
    fun vote(@Valid @RequestBody request: VoteRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = votingService.vote(request, session)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/vote/final")
    fun finalVote(@Valid @RequestBody request: FinalVotingRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = votingService.finalVote(request, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/cast-vote")
    fun castVote(@Valid @RequestBody request: CastVoteRequest, session: HttpSession): ResponseEntity<VoteResponse> {
        return try {
            val userId = sessionUtil.getUserId(session)
                ?: return errorHandler.createVoteErrorResponse(
                    HttpStatus.UNAUTHORIZED, 
                    "Not authenticated"
                )
                
            val response = votingService.castVote(request.gameNumber, userId, request.targetUserId)
            ResponseEntity.ok(response)
            
        } catch (e: Exception) {
            val status = errorHandler.getStatusForException(e)
            val message = errorHandler.getMessageForException(e, "Vote")
            errorHandler.createVoteErrorResponse(status, message)
        }
    }
    
    @PostMapping("/guess-word")
    fun guessWord(@RequestBody request: GuessWordRequest, session: HttpSession): ResponseEntity<LiarGuessResultResponse> {
        val userId = sessionUtil.requireUserId(session)
        val response = gameResultService.submitLiarGuess(request.gameNumber, userId, request.guess)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/modes")
    fun getGameModes(): ResponseEntity<Any> {
        // Return available game modes
        val gameModes = listOf(
            mapOf("id" to 1, "name" to "Classic", "description" to "Classic Liar Game"),
            mapOf("id" to 2, "name" to "Quick", "description" to "Quick Round Liar Game")
        )
        return ResponseEntity.ok(gameModes)
    }

    @GetMapping("/{gameNumber}")
    fun getGameState(@PathVariable gameNumber: Int, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gamePlayService.getGameState(gameNumber, session)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/result/{gameNumber}")
    fun getGameResult(@PathVariable gameNumber: Int, session: HttpSession): ResponseEntity<GameResultResponse> {
        val response = gamePlayService.getGameResult(gameNumber)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/end-of-round")
    fun endOfRound(@RequestBody request: EndOfRoundRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gamePlayService.endOfRound(request, session)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/rooms")
    fun getAllGameRooms(session: HttpSession): ResponseEntity<GameRoomListResponse> {
        val response = gameRoomService.getAllGameRooms(session)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/admin/cleanup/orphaned")
    @Operation(summary = "고아 게임방 정리", description = "플레이어가 모두 이탈했거나 오래된 게임방을 일괄 정리합니다.")
    fun cleanupOrphanedGames(): ResponseEntity<CleanupSummaryResponse> {
        return try {
            val cleanedCount = gameCleanupService.cleanupOrphanedGames()
            ResponseEntity.ok(
                CleanupSummaryResponse(success = true, cleanedCount = cleanedCount, message = "Cleaned $cleanedCount orphaned games")
            )
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(CleanupSummaryResponse(success = false, cleanedCount = 0, message = e.message ?: "Unknown error"))
        }
    }

    @PostMapping("/cleanup/user-data")
    @Operation(summary = "사용자 게임 데이터 정리", description = "현재 세션과 연결된 오래된 게임/플레이어 데이터를 정리합니다.")
    fun cleanupUserGameData(session: HttpSession): ResponseEntity<UserGameCleanupResponse> {
        return try {
            val userId = sessionUtil.getUserId(session)
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    UserGameCleanupResponse(success = false, message = "Not authenticated")
                )

            val nickname = sessionUtil.getUserNickname(session) ?: "Unknown"
            val success = gamePlayerService.cleanupStaleGameData(userId, nickname)
            val message = if (success) {
                "User game data cleaned up successfully"
            } else {
                "Cleanup failed"
            }
            ResponseEntity.ok(UserGameCleanupResponse(success = success, message = message))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(UserGameCleanupResponse(success = false, message = e.message ?: "Unknown error"))
        }
    }

    @DeleteMapping("/admin/cleanup/game/{gameNumber}")
    @Operation(summary = "특정 게임 강제 정리", description = "지정한 게임 번호의 모든 리소스를 관리자 권한으로 제거합니다.")
    fun forceCleanupGame(@PathVariable gameNumber: Int): ResponseEntity<ForceCleanupResponse> {
        return try {
            val success = gameCleanupService.forceCleanupGame(gameNumber)
            if (success) {
                ResponseEntity.ok(
                    ForceCleanupResponse(success = true, message = "Game $gameNumber has been forcefully cleaned up")
                )
            } else {
                ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ForceCleanupResponse(success = false, message = "Game $gameNumber not found"))
            }
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ForceCleanupResponse(success = false, message = e.message ?: "Unknown error"))
        }
    }
    
    @PostMapping("/submit-defense")
    @Operation(summary = "변론 제출", description = "지목된 플레이어가 변론을 제출합니다")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "변론 제출 성공"),
        ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
        ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
        ApiResponse(responseCode = "403", description = "변론 권한 없음")
    ])
    fun submitDefense(
        @RequestBody @Valid request: SubmitDefenseRequest, 
        session: HttpSession
    ): ResponseEntity<DefenseSubmissionResponse> {
        return try {

            val userId = sessionUtil.getUserId(session)
                ?: return errorHandler.createDefenseErrorResponse(
                    request.gameNumber, 
                    HttpStatus.UNAUTHORIZED, 
                    "Not authenticated"
                )
            
            val response = defenseService.submitDefense(request.gameNumber, userId, request.defenseText)
            ResponseEntity.ok(response)
            
        } catch (e: Exception) {
            val status = errorHandler.getStatusForException(e)
            val message = errorHandler.getMessageForException(e, "Defense submission")
            errorHandler.createDefenseErrorResponse(request.gameNumber, status, message)
        }
    }

    @PostMapping("/defense/end")
    @Operation(summary = "변론 종료", description = "지목된 플레이어가 변론을 즉시 종료합니다")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "변론 종료 성공"),
        ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
        ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
        ApiResponse(responseCode = "403", description = "변론 종료 권한 없음")
    ])
    fun endDefense(
        @RequestBody @Valid request: EndDefenseRequest, 
        session: HttpSession
    ): ResponseEntity<GameStateResponse> {
        return try {
            logger.debug("endDefense called with gameNumber: {}", request.gameNumber)

            val userId = sessionUtil.getUserId(session)
            logger.debug("Retrieved userId from session: {}", userId)

            if (userId == null) {
                logger.error("User not authenticated - session userId is null")
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null)
            }

            val response = defenseService.endDefense(request.gameNumber, userId)
            logger.debug("defenseService.endDefense completed successfully")

            ResponseEntity.ok(response)

        } catch (e: IllegalArgumentException) {
            logger.error("IllegalArgumentException in endDefense: {}", e.message)
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null)
        } catch (e: IllegalStateException) {
            logger.error("IllegalStateException in endDefense: {}", e.message)
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null)
        } catch (e: Exception) {
            logger.error("Unexpected exception in endDefense: {}", e.message, e)
            val status = errorHandler.getStatusForException(e)
            ResponseEntity.status(status).body(null)
        }
    }

    @PostMapping("/submit-liar-guess")
    @Operation(summary = "라이어 추측 제출", description = "라이어가 주제에 대한 추측을 제출합니다")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "추측 제출 성공"),
        ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
        ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
        ApiResponse(responseCode = "403", description = "라이어만 추측 가능")
    ])
    fun submitLiarGuess(
        @RequestBody @Valid request: SubmitLiarGuessRequest, 
        session: HttpSession
    ): ResponseEntity<LiarGuessResultResponse> {
        return try {
            
            val userId = sessionUtil.getUserId(session)
                ?: return errorHandler.createLiarGuessErrorResponse(
                    request.gameNumber, 
                    request.guess,
                    HttpStatus.UNAUTHORIZED, 
                    "Not authenticated"
                )
            
            val response = gameResultService.submitLiarGuess(request.gameNumber, userId, request.guess)
            ResponseEntity.ok(response)
            
        } catch (e: Exception) {
            val status = errorHandler.getStatusForException(e)
            val message = errorHandler.getMessageForException(e, "Liar guess submission")
            errorHandler.createLiarGuessErrorResponse(request.gameNumber, request.guess, status, message)
        }
    }

    @GetMapping("/recover-state/{gameNumber}")
    @Operation(summary = "게임 상태 복구", description = "재연결 시 현재 게임 상태를 복구합니다")
    fun recoverGameState(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<GameRecoveryResponse> {
        return try {
            val userId = sessionUtil.getUserId(session)
                ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(recoveryResponseFactory.buildUnauthorizedResponse(gameNumber))

            val recoveryData = gamePlayService.recoverGameState(gameNumber, userId)
            ResponseEntity.ok(recoveryData)

        } catch (e: Exception) {
            val status = errorHandler.getStatusForException(e)
            val errorMessage = e.message ?: "Unknown error"
            ResponseEntity.status(status)
                .body(recoveryResponseFactory.buildErrorResponse(gameNumber, errorMessage))
        }
    }

    @MessageMapping("/game/{gameNumber}/vote")
    fun handleVote(
        @DestinationVariable gameNumber: Int,
        @Payload request: CastVoteRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        try {
            val userId = headerAccessor.sessionAttributes?.get("userId") as? Long
                ?: throw IllegalArgumentException("Not authenticated")
            
            votingService.castVote(gameNumber, userId, request.targetUserId)

        } catch (e: Exception) {
            logger.error("WebSocket vote failed: {}", e.message)
            // 에러는 서비스 레벨에서 WebSocket으로 전송됨
        }
    }
    
    @MessageMapping("/game/{gameNumber}/guess-topic")
    fun handleTopicGuess(
        @DestinationVariable gameNumber: Int,
        @Payload request: SubmitLiarGuessRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        try {
            val userId = headerAccessor.sessionAttributes?.get("userId") as? Long
                ?: throw IllegalArgumentException("Not authenticated")
            
            gameResultService.submitLiarGuess(gameNumber, userId, request.guess)
            
        } catch (e: Exception) {
            logger.error("WebSocket topic guess failed: {}", e.message)
        }
    }

    @PostMapping("/{gameNumber}/kick-owner")
    @Operation(summary = "방장 강퇴 및 권한 이양", description = "시간 초과로 인한 방장 강퇴 후 다음 플레이어에게 권한 이양")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "방장 강퇴 및 권한 이양 성공"),
        ApiResponse(responseCode = "400", description = "잘못된 요청"),
        ApiResponse(responseCode = "404", description = "게임방을 찾을 수 없음")
    ])
    fun kickOwnerAndTransferOwnership(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<OwnerKickResponse> {
        return try {
            val result = gamePlayerService.kickOwnerAndTransferOwnership(gameNumber)
            ResponseEntity.ok(result)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }

    @PostMapping("/{gameNumber}/extend-time")
    @Operation(summary = "게임 시작 시간 연장", description = "방장이 게임 시작 시간을 5분 연장")
    fun extendGameStartTime(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<TimeExtensionResponse> {
        return try {
            val userId = sessionUtil.getUserId(session)
            val result = gamePlayService.extendGameStartTime(gameNumber, userId)
            ResponseEntity.ok(result)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }

    // === 플레이어 준비 상태 ===
    @PostMapping("/{gameNumber}/ready")
    fun togglePlayerReady(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<PlayerReadyResponse> {
        return ResponseEntity.ok(playerReadinessService.togglePlayerReady(gameNumber, session))
    }

    @GetMapping("/{gameNumber}/ready-status")
    fun getAllReadyStates(
        @PathVariable gameNumber: Int
    ): ResponseEntity<List<PlayerReadyResponse>> {
        return ResponseEntity.ok(playerReadinessService.getAllReadyStates(gameNumber))
    }

    // === 카운트다운 ===
    @PostMapping("/{gameNumber}/countdown/start")
    fun startCountdown(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<CountdownResponse> {
        return ResponseEntity.ok(gameCountdownService.startCountdown(gameNumber, session))
    }

    @PostMapping("/{gameNumber}/countdown/cancel")
    fun cancelCountdown(
        @PathVariable gameNumber: Int
    ): ResponseEntity<CountdownResponse> {
        return ResponseEntity.ok(gameCountdownService.cancelCountdown(gameNumber))
    }

    @GetMapping("/{gameNumber}/countdown/status")
    fun getCountdownStatus(
        @PathVariable gameNumber: Int
    ): ResponseEntity<CountdownResponse?> {
        return ResponseEntity.ok(gameCountdownService.getCountdownStatus(gameNumber))
    }

    @GetMapping("/{gameNumber}/voting-status")
    fun getVotingStatus(
        @PathVariable gameNumber: Int
    ): ResponseEntity<VotingStatusResponse> {
        return ResponseEntity.ok(enhancedVotingService.getVotingStatus(gameNumber))
    }

    @GetMapping("/{gameNumber}/connection-status")
    fun getConnectionStatus(
        @PathVariable gameNumber: Int
    ): ResponseEntity<List<org.example.kotlin_liargame.global.connection.dto.PlayerConnectionStatus>> {
        return ResponseEntity.ok(enhancedConnectionService.getConnectionStatus(gameNumber))
    }

    /**
     * 현재 HTTP 세션과 연관된 모든 WebSocket 세션 정보를 갱신
     */
    private fun refreshAllWebSocketSessions(httpSession: HttpSession) {
        try {
            val userId = sessionUtil.getUserId(httpSession)
            if (userId != null) {
                logger.debug("Attempting to refresh WebSocket sessions for userId: {}", userId)
                webSocketSessionManager.refreshSessionsForUser(userId, httpSession)
            }
        } catch (e: Exception) {
            logger.warn("Failed to refresh WebSocket sessions: {}", e.message)
        }
    }
}
