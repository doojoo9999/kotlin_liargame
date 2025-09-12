package org.example.kotlin_liargame.global.messaging

import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class GameMessagingService(
    private val messagingTemplate: SimpMessagingTemplate
) {

    /**
     * 게임 전체 플레이어에게 메시지 전송
     */
    fun sendToGame(gameNumber: Int, endpoint: String, message: Any) {
        messagingTemplate.convertAndSend("/topic/game/$gameNumber/$endpoint", message)
    }

    /**
     * 특정 플레이어에게만 메시지 전송
     */
    fun sendToPlayer(playerId: Long, gameNumber: Int, endpoint: String, message: Any) {
        messagingTemplate.convertAndSendToUser(
            playerId.toString(),
            "/topic/game/$gameNumber/$endpoint",
            message
        )
    }

    /**
     * 사회자 메시지 전송
     */
    fun sendModeratorMessage(gameNumber: Int, content: String) {
        val message = ModeratorMessage(
            content = content,
            timestamp = Instant.now()
        )
        sendToGame(gameNumber, "moderator", message)
    }

    /**
     * 게임 상태 브로드캐스트
     */
    fun broadcastGameState(gameNumber: Int, gameState: Any) {
        sendToGame(gameNumber, "state", gameState)
    }

    /**
     * 게임 이벤트 브로드캐스트
     */
    fun broadcastGameEvent(gameNumber: Int, event: Any) {
        sendToGame(gameNumber, "events", event)
    }

    /**
     * 카운트다운 업데이트 전송
     */
    fun sendCountdownUpdate(gameNumber: Int, remainingTime: Int, phase: String) {
        val message = CountdownUpdateMessage(
            gameNumber = gameNumber,
            remainingTime = remainingTime,
            phase = phase,
            timestamp = Instant.now()
        )
        sendToGame(gameNumber, "countdown", message)
    }

    /**
     * 진행 상황 업데이트 전송
     */
    fun sendProgressUpdate(gameNumber: Int, current: Int, total: Int, type: String) {
        val message = ProgressUpdateMessage(
            gameNumber = gameNumber,
            current = current,
            total = total,
            type = type,
            timestamp = Instant.now()
        )
        sendToGame(gameNumber, "progress", message)
    }

    /**
     * 채팅 상태 업데이트 전송
     */
    fun sendChatStatusUpdate(gameNumber: Int, status: String, data: Map<String, Any> = emptyMap()) {
        val message = mutableMapOf<String, Any>(
            "type" to status,
            "gameNumber" to gameNumber,
            "timestamp" to Instant.now().toString()
        ).apply { putAll(data) }

        messagingTemplate.convertAndSend("/topic/chat.status.$gameNumber", message)
    }

    /**
     * 로비 업데이트 전송
     */
    fun sendLobbyUpdate(message: Map<String, Any>) {
        messagingTemplate.convertAndSend("/topic/lobby", message)
    }

    /**
     * 룸 업데이트 전송
     */
    fun sendRoomUpdate(gameNumber: Int, message: Map<String, Any>) {
        messagingTemplate.convertAndSend("/topic/room.$gameNumber", message)
    }

    /**
     * 세션 동기화 상태 확인 메시지 전송
     */
    fun sendSessionSyncStatus(gameNumber: Int, userId: Long, syncStatus: String) {
        val message = SessionSyncMessage(
            gameNumber = gameNumber,
            userId = userId,
            syncStatus = syncStatus,
            timestamp = Instant.now()
        )
        sendToGame(gameNumber, "session-sync", message)
    }
}

// 메시지 데이터 클래스들
data class ModeratorMessage(
    val content: String,
    val timestamp: Instant
)

data class CountdownUpdateMessage(
    val gameNumber: Int,
    val remainingTime: Int,
    val phase: String,
    val timestamp: Instant
)

data class ProgressUpdateMessage(
    val gameNumber: Int,
    val current: Int,
    val total: Int,
    val type: String,
    val timestamp: Instant
)

data class SessionSyncMessage(
    val gameNumber: Int,
    val userId: Long,
    val syncStatus: String,
    val timestamp: Instant
)
