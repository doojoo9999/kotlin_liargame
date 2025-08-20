package org.example.kotlin_liargame.domain.game.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.servlet.http.HttpSession
import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.game.dto.request.*
import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.service.*
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
    private val sessionUtil: SessionUtil,
    private val errorHandler: ControllerErrorHandler
) {
    
    @PostMapping("/create")
    fun createGameRoom(@Valid @RequestBody request: CreateGameRoomRequest, session: HttpSession): ResponseEntity<Int> {
        val gameNumber = gameService.createGameRoom(request, session)
        return ResponseEntity.ok(gameNumber)
    }

    @PostMapping("/join")
    fun joinGame(@Valid @RequestBody request: JoinGameRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        return try {
            val response = gameService.joinGame(request, session)
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            println("[ERROR] Failed to join game: ${e.message}")
            ResponseEntity.badRequest().body(null)
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
    fun startGame(@Valid @RequestBody request: StartGameRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        return try {
            val gameState = gameProgressService.startGame(request, session)
            ResponseEntity.ok(gameState)
        } catch (e: Exception) {
            println("[ERROR] Failed to start game: ${e.message}")
            ResponseEntity.badRequest().body(null)
        }
    }
    
    @PostMapping("/hint")
    fun giveHint(@Valid @RequestBody request: GiveHintRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameProgressService.giveHint(request, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/vote")
    fun vote(@Valid @RequestBody request: VoteRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = votingService.vote(request, session)
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
                
            val response = votingService.castVote(request.gameNumber, userId, request.targetPlayerId)
            ResponseEntity.ok(response)
            
        } catch (e: Exception) {
            val status = errorHandler.getStatusForException(e)
            val message = errorHandler.getMessageForException(e, "Vote")
            errorHandler.createVoteErrorResponse(status, message)
        }
    }
    
    @PostMapping("/defend")
    fun defend(@RequestBody request: DefendRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = gameService.defend(request, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/survival-vote")
    fun survivalVote(@RequestBody request: SurvivalVoteRequest, session: HttpSession): ResponseEntity<GameStateResponse> {
        val response = votingService.survivalVote(request, session)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/guess-word")
    fun guessWord(@RequestBody request: GuessWordRequest, session: HttpSession): ResponseEntity<GameResultResponse> {
        val response = gameService.guessWord(request, session)
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

    @PostMapping("/cast-final-judgment")
    @Operation(summary = "최종 판결 투표", description = "플레이어가 처형/생존에 대해 투표합니다")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "투표 성공"),
        ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
        ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
        ApiResponse(responseCode = "403", description = "투표 권한 없음")
    ])
    fun castFinalJudgment(
        @RequestBody @Valid request: CastFinalJudgmentRequest, 
        session: HttpSession
    ): ResponseEntity<FinalVoteResponse> {
        return try {
            
            val userId = sessionUtil.getUserId(session)
                ?: return errorHandler.createFinalVoteErrorResponse(
                    request.gameNumber, 
                    HttpStatus.UNAUTHORIZED, 
                    "Not authenticated"
                )
            
            val response = defenseService.castFinalVote(request.gameNumber, userId, request.voteForExecution)
            ResponseEntity.ok(response)
            
        } catch (e: Exception) {
            val status = errorHandler.getStatusForException(e)
            val message = errorHandler.getMessageForException(e, "Final judgment")
            errorHandler.createFinalVoteErrorResponse(request.gameNumber, status, message)
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
    ): ResponseEntity<Map<String, Any>> {
        return try {
            val userId = sessionUtil.getUserId(session)
                ?: return errorHandler.createUnauthorizedResponse()

            val recoveryData = gameService.recoverGameState(gameNumber, userId)
            ResponseEntity.ok(recoveryData)

        } catch (e: Exception) {
            val status = errorHandler.getStatusForException(e)
            ResponseEntity.status(status).body(
                mapOf(
                    "error" to "Failed to recover game state: ${e.message}",
                    "gameNumber" to gameNumber
                )
            )
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
            
            votingService.castVote(gameNumber, userId, request.targetPlayerId)
            
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
            // 에러는 서비스 레벨에서 WebSocket으로 전송됨
        }
    }
}
