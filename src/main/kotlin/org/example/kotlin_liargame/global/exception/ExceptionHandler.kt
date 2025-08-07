package org.example.kotlin_liargame.global.exception

import org.example.kotlin_liargame.global.dto.ErrorResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant

@RestControllerAdvice
class GlobalExceptionHandler(
    private val messagingTemplate: SimpMessagingTemplate
) {
    
    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(e: IllegalArgumentException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(message = e.message ?: "잘못된 요청입니다"))
    }
    
    @ExceptionHandler(IllegalStateException::class)
    fun handleIllegalStateException(e: IllegalStateException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse(message = e.message ?: "게임 상태 오류입니다"))
    }
    
    @ExceptionHandler(GameNotFoundException::class)
    fun handleGameNotFoundException(e: GameNotFoundException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse(message = e.message ?: "게임을 찾을 수 없습니다"))
    }
    
    @ExceptionHandler(PlayerNotFoundException::class)
    fun handlePlayerNotFoundException(e: PlayerNotFoundException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse(message = e.message ?: "플레이어를 찾을 수 없습니다"))
    }
    
    @ExceptionHandler(VotingException::class)
    fun handleVotingException(e: VotingException): ResponseEntity<ErrorResponse> {
        // WebSocket으로 투표 에러 전송
        if (e.gameNumber != null) {
            sendGameErrorMessage(e.gameNumber, e.message ?: "투표 중 오류가 발생했습니다")
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(message = e.message ?: "투표 중 오류가 발생했습니다"))
    }
    
    @ExceptionHandler(GamePhaseException::class)
    fun handleGamePhaseException(e: GamePhaseException): ResponseEntity<ErrorResponse> {
        // WebSocket으로 게임 단계 에러 전송
        if (e.gameNumber != null) {
            sendGameErrorMessage(e.gameNumber, e.message ?: "게임 단계 오류입니다")
        }
        
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse(message = e.message ?: "게임 단계 오류입니다"))
    }
    
    @ExceptionHandler(PlayerDisconnectedException::class)
    fun handlePlayerDisconnectedException(e: PlayerDisconnectedException): ResponseEntity<ErrorResponse> {
        // WebSocket으로 플레이어 연결 끊김 알림
        if (e.gameNumber != null) {
            sendPlayerDisconnectedMessage(e.gameNumber, e.playerId, e.playerNickname)
        }
        
        return ResponseEntity.status(HttpStatus.GONE)
            .body(ErrorResponse(message = e.message ?: "플레이어 연결이 끊어졌습니다"))
    }
    
    @ExceptionHandler(Exception::class)
    fun handleGenericException(e: Exception): ResponseEntity<ErrorResponse> {
        println("[ERROR] Unexpected error: ${e.message}")
        e.printStackTrace()
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse(message = "서버 내부 오류가 발생했습니다"))
    }
    
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
}

class GameNotFoundException(message: String) : RuntimeException(message)
class PlayerNotFoundException(message: String) : RuntimeException(message)
class VotingException(message: String, val gameNumber: Int? = null) : RuntimeException(message)
class GamePhaseException(message: String, val gameNumber: Int? = null) : RuntimeException(message)
class PlayerDisconnectedException(
    message: String, 
    val gameNumber: Int? = null, 
    val playerId: Long? = null, 
    val playerNickname: String? = null
) : RuntimeException(message)
