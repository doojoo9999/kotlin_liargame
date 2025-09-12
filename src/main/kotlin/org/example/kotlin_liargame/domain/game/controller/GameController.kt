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
    private val gameService: GameService,
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
    private val enhancedConnectionService: org.example.kotlin_liargame.global.connection.service.EnhancedConnectionService
) {
    
    @PostMapping("/create")
    fun createGameRoom(@Valid @RequestBody request: CreateGameRoomRequest, session: HttpSession): ResponseEntity<Int> {
        val gameNumber = gameService.createGameRoom(request, session)

        // 게임 생성 후 WebSocket 세션 정보 갱신
        refreshAllWebSocketSessions(session)

        return ResponseEntity.ok(gameNumber)
    }

    @PostMapping("/join")
    fun joinGame(@Valid @RequestBody request: JoinGameRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        return try {
            val response = gameService.joinGame(request, session)

            // 게임 입장 성공 후 WebSocket 세션 정보 갱신
            refreshAllWebSocketSessions(session)

            ResponseEntity.ok(response)
        } catch (e: GameNotFoundException) {
            println("[ERROR] Game not found: ${e.message}")
            ResponseEntity.status(404).body(null)
        } catch (e: GameAlreadyStartedException) {
            println("[ERROR] Game already started: ${e.message}")
            ResponseEntity.status(409).body(null)
        } catch (e: RoomFullException) {
            println("[ERROR] Room is full: ${e.message}")
            ResponseEntity.status(409).body(null)
        } catch (e: RuntimeException) {
            println("[ERROR] Runtime exception during join: ${e.message}")
            e.printStackTrace()
            ResponseEntity.badRequest().body(null)
        } catch (e: Exception) {
            println("[ERROR] Unexpected error during join: ${e.message}")
            e.printStackTrace()
            ResponseEntity.status(500).body(null)
        }
    }


    @PostMapping("/leave")
    fun leaveGame(@Valid @RequestBody request: LeaveGameRequest, session: HttpSession): ResponseEntity<Boolean> {
        return try {
            val response = gameService.leaveGame(request, session)
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            println("[ERROR] Failed to leave game: ${e.message}")
            ResponseEntity.badRequest().body(null)
        }
    }

    
    @PostMapping("/start")
    fun startGame(session: HttpSession): ResponseEntity<GameStateResponse> {
        return try {
            val gameState = gameProgressService.startGame(session)
            ResponseEntity.ok(gameState)
        } catch (e: Exception) {
            println("[ERROR] Failed to start game: ${e.message}")
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
    
    @GetMapping("/{gameNumber}")
    fun getGameState(@PathVariable gameNumber: Int, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameService.getGameState(gameNumber, session)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/result/{gameNumber}")
    fun getGameResult(@PathVariable gameNumber: Int, session: HttpSession): ResponseEntity<GameResultResponse> {
        val response = gameService.getGameResult(gameNumber, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/end-of-round")
    fun endOfRound(@RequestBody request: EndOfRoundRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameService.endOfRound(request, session)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/rooms")
    fun getAllGameRooms(session: HttpSession): ResponseEntity<GameRoomListResponse> {
        val response = gameService.getAllGameRooms(session)
        return ResponseEntity.ok(response)
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
            println("[DEBUG] endDefense called with gameNumber: ${request.gameNumber}")

            val userId = sessionUtil.getUserId(session)
            println("[DEBUG] Retrieved userId from session: $userId")

            if (userId == null) {
                println("[ERROR] User not authenticated - session userId is null")
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null)
            }

            val response = defenseService.endDefense(request.gameNumber, userId)
            println("[DEBUG] defenseService.endDefense completed successfully")

            ResponseEntity.ok(response)

        } catch (e: IllegalArgumentException) {
            println("[ERROR] IllegalArgumentException in endDefense: ${e.message}")
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null)
        } catch (e: IllegalStateException) {
            println("[ERROR] IllegalStateException in endDefense: ${e.message}")
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null)
        } catch (e: Exception) {
            println("[ERROR] Unexpected exception in endDefense: ${e.message}")
            e.printStackTrace()
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

            val recoveryData = gameService.recoverGameState(gameNumber, userId)
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
            println("[ERROR] WebSocket vote failed: ${e.message}")
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
            println("[ERROR] WebSocket topic guess failed: ${e.message}")
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
    ): ResponseEntity<Map<String, Any>> {
        return try {
            val result = gameService.kickOwnerAndTransferOwnership(gameNumber)
            ResponseEntity.ok(mapOf(
                "success" to true as Any,
                "message" to "방장이 강퇴되고 권한이 이양되었습니다." as Any,
                "newOwner" to result.newOwner as Any,
                "kickedPlayer" to result.kickedPlayer as Any
            ))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf(
                "success" to false as Any,
                "message" to (e.message ?: "잘못된 요청입니다.") as Any
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "success" to false as Any,
                "message" to "방장 강퇴 처리 중 오류가 발생했습니다." as Any
            ))
        }
    }

    @PostMapping("/{gameNumber}/extend-time")
    @Operation(summary = "게임 시작 시간 연장", description = "방장이 게임 시작 시간을 5분 연장")
    fun extendGameStartTime(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<Map<String, Any>> {
        return try {
            val userId = sessionUtil.getUserId(session)
            val result = gameService.extendGameStartTime(gameNumber, userId)
            ResponseEntity.ok(mapOf(
                "success" to true as Any,
                "message" to "게임 시작 시간이 5분 연장되었습니다." as Any,
                "extendedUntil" to result.extendedUntil as Any
            ))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf(
                "success" to false as Any,
                "message" to (e.message ?: "잘못된 요청입니다.") as Any
            ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "success" to false as Any,
                "message" to "시간 연장 처리 중 오류가 발생했습니다." as Any
            ))
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
                // WebSocketSessionManager에서 해당 사용자의 모든 세션을 찾아서 갱신
                // 현재는 세션 ID로 직접 매핑되어 있으므로, 향후 개선 시 사용자 ID 기반 검색 추가 가능
                println("[DEBUG] Attempting to refresh WebSocket sessions for userId: $userId")

                // 임시로 현재 HTTP 세션 ID로 WebSocket 세션을 찾아서 갱신
                val sessionId = httpSession.id
                webSocketSessionManager.refreshSessionInfo(sessionId, httpSession)
            }
        } catch (e: Exception) {
            println("[WARN] Failed to refresh WebSocket sessions: ${e.message}")
        }
    }
}
