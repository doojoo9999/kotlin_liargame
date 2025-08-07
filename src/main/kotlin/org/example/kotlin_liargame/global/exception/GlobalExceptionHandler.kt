package org.example.kotlin_liargame.global.exception

import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.messaging.handler.annotation.MessageExceptionHandler
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.context.request.WebRequest
import java.time.Instant

@RestControllerAdvice
class GlobalExceptionHandler(
    private val messagingTemplate: SimpMessagingTemplate
) {
    
    // Bean Validation Exception Handlers
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val fieldErrors = ex.bindingResult.fieldErrors.associate { error ->
            error.field to (error.defaultMessage ?: "Invalid value")
        }
        
        val errorResponse = ErrorResponse(
            errorCode = "VALIDATION_ERROR",
            message = "Validation failed",
            userFriendlyMessage = "입력값이 올바르지 않습니다.",
            details = mapOf("fieldErrors" to fieldErrors)
        )
        
        println("[ERROR] Validation error: $fieldErrors")
        
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }
    
    // GameException hierarchy handlers
    @ExceptionHandler(GameException::class)
    fun handleGameException(
        ex: GameException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = ex.errorCode,
            message = ex.message ?: "Unknown error",
            userFriendlyMessage = ex.userFriendlyMessage,
            details = mapOf(
                "path" to (request.getDescription(false) ?: "")
            )
        )
        
        // Log the error for debugging
        println("[ERROR] ${ex.errorCode}: ${ex.message}")
        ex.printStackTrace()
        
        val httpStatus = when (ex) {
            is GameNotFoundException, is PlayerNotFoundException -> HttpStatus.NOT_FOUND
            is UnauthorizedActionException -> HttpStatus.FORBIDDEN
            is GameFullException, is InvalidVoteException, is VotingException -> HttpStatus.BAD_REQUEST
            is RateLimitExceededException -> HttpStatus.TOO_MANY_REQUESTS
            is ConcurrencyException -> HttpStatus.CONFLICT
            else -> HttpStatus.INTERNAL_SERVER_ERROR
        }
        
        return ResponseEntity(errorResponse, httpStatus)
    }
    
    // Legacy exception handlers from ExceptionHandler.kt
    @ExceptionHandler(VotingException::class)
    fun handleVotingException(e: VotingException): ResponseEntity<ErrorResponse> {
        // WebSocket으로 투표 에러 전송
        if (e.gameNumber != null) {
            sendGameErrorMessage(e.gameNumber, e.message ?: "투표 중 오류가 발생했습니다")
        }
        
        val errorResponse = ErrorResponse(
            errorCode = "VOTING_ERROR",
            message = e.message ?: "투표 중 오류가 발생했습니다",
            userFriendlyMessage = e.message ?: "투표 중 오류가 발생했습니다"
        )
        
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(GamePhaseException::class)
    fun handleGamePhaseException(e: GamePhaseException): ResponseEntity<ErrorResponse> {
        // WebSocket으로 게임 단계 에러 전송
        if (e.gameNumber != null) {
            sendGameErrorMessage(e.gameNumber, e.message ?: "게임 단계 오류입니다")
        }
        
        val errorResponse = ErrorResponse(
            errorCode = "GAME_PHASE_ERROR",
            message = e.message ?: "게임 단계 오류입니다",
            userFriendlyMessage = e.message ?: "게임 단계 오류입니다"
        )
        
        return ResponseEntity(errorResponse, HttpStatus.CONFLICT)
    }
    
    @ExceptionHandler(PlayerDisconnectedException::class)
    fun handlePlayerDisconnectedException(e: PlayerDisconnectedException): ResponseEntity<ErrorResponse> {
        // WebSocket으로 플레이어 연결 끊김 알림
        if (e.gameNumber != null) {
            sendPlayerDisconnectedMessage(e.gameNumber, e.playerId, e.playerNickname)
        }
        
        val errorResponse = ErrorResponse(
            errorCode = "PLAYER_DISCONNECTED",
            message = e.message ?: "플레이어 연결이 끊어졌습니다",
            userFriendlyMessage = e.message ?: "플레이어 연결이 끊어졌습니다"
        )
        
        return ResponseEntity(errorResponse, HttpStatus.GONE)
    }
    
    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(
        ex: IllegalArgumentException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "INVALID_ARGUMENT",
            message = ex.message ?: "Invalid argument",
            userFriendlyMessage = "잘못된 요청입니다.",
            details = mapOf(
                "path" to (request.getDescription(false) ?: "")
            )
        )
        
        println("[ERROR] IllegalArgumentException: ${ex.message}")
        
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalStateException(
        ex: IllegalStateException,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "INVALID_STATE",
            message = ex.message ?: "Invalid state",
            userFriendlyMessage = "현재 상태에서는 해당 작업을 수행할 수 없습니다.",
            details = mapOf(
                "path" to (request.getDescription(false) ?: "")
            )
        )
        
        println("[ERROR] IllegalStateException: ${ex.message}")
        
        return ResponseEntity(errorResponse, HttpStatus.CONFLICT)
    }
    
    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception,
        request: WebRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            errorCode = "INTERNAL_ERROR",
            message = "Internal server error",
            userFriendlyMessage = "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            details = mapOf(
                "path" to (request.getDescription(false) ?: ""),
                "exceptionType" to ex.javaClass.simpleName
            )
        )
        
        println("[ERROR] Unhandled exception: ${ex.message}")
        ex.printStackTrace()
        
        return ResponseEntity(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    
    // WebSocket exception handlers
    @MessageExceptionHandler(GameException::class)
    fun handleWebSocketGameException(ex: GameException): ErrorResponse {
        val errorResponse = ErrorResponse(
            errorCode = ex.errorCode,
            message = ex.message ?: "Unknown error",
            userFriendlyMessage = ex.userFriendlyMessage
        )
        
        println("[WEBSOCKET_ERROR] ${ex.errorCode}: ${ex.message}")
        
        return errorResponse
    }
    
    @MessageExceptionHandler(Exception::class)
    fun handleWebSocketGenericException(ex: Exception): ErrorResponse {
        val errorResponse = ErrorResponse(
            errorCode = "WEBSOCKET_ERROR",
            message = "WebSocket communication error",
            userFriendlyMessage = "실시간 통신 중 오류가 발생했습니다."
        )
        
        println("[WEBSOCKET_ERROR] Unhandled WebSocket exception: ${ex.message}")
        ex.printStackTrace()
        
        return errorResponse
    }
    
    // WebSocket messaging methods
    private fun sendGameErrorMessage(gameNumber: Int, message: String) {
        try {
            val errorMessage = mapOf(
                "type" to "ERROR",
                "message" to message,
                "timestamp" to Instant.now()
            )
            
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/error",
                errorMessage
            )
        } catch (e: Exception) {
            println("[ERROR] Failed to send error message via WebSocket: ${e.message}")
        }
    }
    
    private fun sendPlayerDisconnectedMessage(gameNumber: Int, playerId: Long?, playerNickname: String?) {
        try {
            val disconnectMessage = mapOf(
                "type" to "PLAYER_DISCONNECTED",
                "playerId" to playerId,
                "playerNickname" to playerNickname,
                "message" to "${playerNickname ?: "플레이어"}님의 연결이 끊어졌습니다",
                "timestamp" to Instant.now()
            )
            
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/player-status",
                disconnectMessage
            )
        } catch (e: Exception) {
            println("[ERROR] Failed to send disconnect message via WebSocket: ${e.message}")
        }
    }
    
    /**
     * Send error message to specific game room via WebSocket
     */
    fun sendGameError(gameNumber: Int, error: GameException) {
        try {
            val errorResponse = ErrorResponse(
                errorCode = error.errorCode,
                message = error.message ?: "Unknown error",
                userFriendlyMessage = error.userFriendlyMessage
            )
            
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/error",
                errorResponse
            )
        } catch (e: Exception) {
            println("[ERROR] Failed to send error message via WebSocket: ${e.message}")
        }
    }
    
    /**
     * Send error message to specific user via WebSocket
     */
    fun sendUserError(userId: Long, error: GameException) {
        try {
            val errorResponse = ErrorResponse(
                errorCode = error.errorCode,
                message = error.message ?: "Unknown error",
                userFriendlyMessage = error.userFriendlyMessage
            )
            
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/topic/error",
                errorResponse
            )
        } catch (e: Exception) {
            println("[ERROR] Failed to send user error message via WebSocket: ${e.message}")
        }
    }
}