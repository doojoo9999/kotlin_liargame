package org.example.kotlin_liargame.tools.websocket

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.global.util.SessionUtil
import org.springframework.context.annotation.Lazy
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

@Component
class WebSocketSessionManager(
    @Lazy private val messagingTemplate: SimpMessagingTemplate,
    private val sessionUtil: SessionUtil
) {
    private val sessionMap = ConcurrentHashMap<String, Map<String, Any>>()
    
    private val playerGameMap = ConcurrentHashMap<Long, Int>()


    fun storeSession(webSocketSessionId: String, httpSession: HttpSession) {
        // JSON 직렬화 방식으로 세션 데이터 조회 (재시도 메커니즘 포함)
        var userId = sessionUtil.getUserId(httpSession)
        var nickname = sessionUtil.getUserNickname(httpSession)

        // 세션 정보가 없는 경우 Redis 동기화를 위해 재시도
        if (userId == null || nickname == null) {
            println("[WARN] Initial session data not found for WebSocket: $webSocketSessionId, attempting retry...")

            // 짧은 지연 후 재시도 (Redis 동기화 대기)
            Thread.sleep(100)
            userId = sessionUtil.getUserId(httpSession)
            nickname = sessionUtil.getUserNickname(httpSession)

            if (userId == null || nickname == null) {
                // 두 번째 시도
                Thread.sleep(200)
                userId = sessionUtil.getUserId(httpSession)
                nickname = sessionUtil.getUserNickname(httpSession)
            }
        }

        val sessionInfo = mutableMapOf<String, Any>()
        if (userId != null) {
            sessionInfo["userId"] = userId
            println("[DEBUG] Storing WebSocket session mapping: $webSocketSessionId -> userId=$userId")
        } else {
            println("[WARN] No userId found in session for WebSocket: $webSocketSessionId after retries")
        }

        if (nickname != null) {
            sessionInfo["nickname"] = nickname
        } else {
            println("[WARN] No nickname found in session for WebSocket: $webSocketSessionId after retries")
        }

        sessionInfo["connectedAt"] = Instant.now()
        sessionMap[webSocketSessionId] = sessionInfo
        println("[DEBUG] WebSocket session stored: $webSocketSessionId -> $sessionInfo")
        printSessionInfo()
    }


    fun getUserId(webSocketSessionId: String): Long? {
        return sessionMap[webSocketSessionId]?.get("userId") as? Long
    }


    fun getNickname(webSocketSessionId: String): String? {
        return sessionMap[webSocketSessionId]?.get("nickname") as? String
    }

    fun injectUserInfo(accessor: SimpMessageHeaderAccessor) {
        val sessionId = accessor.sessionId ?: return
        val sessionInfo = sessionMap[sessionId] ?: return

        accessor.sessionAttributes = accessor.sessionAttributes ?: mutableMapOf()

        sessionInfo.forEach { (key, value) ->
            accessor.sessionAttributes!![key] = value
        }
    }


    fun registerPlayerInGame(userId: Long, gameNumber: Int) {
        playerGameMap[userId] = gameNumber
        println("[DEBUG] Registered player $userId in game $gameNumber")
    }

    fun removePlayerFromGame(userId: Long) {
        val gameNumber = playerGameMap.remove(userId)
        if (gameNumber != null) {
            println("[DEBUG] Removed player $userId from game $gameNumber")
        }
    }

    fun getPlayerGame(userId: Long): Int? {
        return playerGameMap[userId]
    }

    fun removeSession(webSocketSessionId: String) {
        val sessionInfo = sessionMap.remove(webSocketSessionId)
        println("[DEBUG] Removed WebSocket session: $webSocketSessionId")
        
        if (sessionInfo != null) {
            val userId = sessionInfo["userId"] as? Long
            val nickname = sessionInfo["nickname"] as? String
            
            if (userId != null) {
                val gameNumber = getPlayerGame(userId)
                if (gameNumber != null) {
                    handlePlayerDisconnection(gameNumber, userId, nickname)
                    removePlayerFromGame(userId)
                }
            }
        }
    }

    private fun handlePlayerDisconnection(gameNumber: Int, userId: Long, nickname: String?) {
        try {
            val disconnectMessage = mapOf(
                "type" to "PLAYER_DISCONNECTED",
                "playerId" to userId,
                "playerNickname" to nickname,
                "message" to "${nickname ?: "플레이어"}님의 연결이 끊어졌습니다",
                "timestamp" to Instant.now()
            )
            
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/player-status",
                disconnectMessage
            )
            
            checkGameContinuity(gameNumber, nickname)
            
            println("[INFO] Notified game $gameNumber about player $userId ($nickname) disconnection")
            
        } catch (e: Exception) {
            println("[ERROR] Failed to handle player disconnection: ${e.message}")
        }
    }
    private fun checkGameContinuity(gameNumber: Int, nickname: String?) {
        try {
            val remainingPlayers = playerGameMap.values.count { it == gameNumber }
            
            println("[DEBUG] Game $gameNumber continuity check: $remainingPlayers players remaining after $nickname disconnection")

            if (remainingPlayers == 0) {
                // 방에 아무도 없으면 게임 종료
                val gameEndMessage = mapOf(
                    "type" to "GAME_ENDED",
                    "reason" to "ALL_PLAYERS_DISCONNECTED",
                    "message" to "모든 플레이어가 연결 해제되어 게임이 종료됩니다",
                    "timestamp" to Instant.now()
                )

                messagingTemplate.convertAndSend(
                    "/topic/game/$gameNumber/game-status",
                    gameEndMessage
                )

                println("[INFO] Game $gameNumber ended - all players disconnected")
            } else if (remainingPlayers < 3) {
                val gameEndMessage = mapOf(
                    "type" to "GAME_INTERRUPTED",
                    "reason" to "INSUFFICIENT_PLAYERS",
                    "message" to "플레이어 수가 부족하여 게임이 중단됩니다",
                    "remainingPlayers" to remainingPlayers,
                    "timestamp" to Instant.now()
                )
                
                messagingTemplate.convertAndSend(
                    "/topic/game/$gameNumber/game-status",
                    gameEndMessage
                )
                
                println("[INFO] Game $gameNumber interrupted due to insufficient players ($remainingPlayers remaining)")
            }
            
        } catch (e: Exception) {
            println("[ERROR] Failed to check game continuity: ${e.message}")
        }
    }

    fun printSessionInfo() {
        println("[DEBUG] Current WebSocket sessions (${sessionMap.size})")
        sessionMap.forEach { (sessionId, info) ->
            println("[DEBUG]   - $sessionId: $info")
        }
    }

    /**
     * WebSocket 세션의 사용자 정보를 수동으로 갱신
     */
    fun refreshSessionInfo(webSocketSessionId: String, httpSession: HttpSession) {
        val userId = sessionUtil.getUserId(httpSession)
        val nickname = sessionUtil.getUserNickname(httpSession)

        if (userId != null && nickname != null) {
            val existingInfo = sessionMap[webSocketSessionId]?.toMutableMap() ?: mutableMapOf()
            existingInfo["userId"] = userId
            existingInfo["nickname"] = nickname
            existingInfo["lastRefresh"] = Instant.now()

            sessionMap[webSocketSessionId] = existingInfo
            println("[DEBUG] Refreshed WebSocket session info: $webSocketSessionId -> userId=$userId, nickname=$nickname")
            printSessionInfo()
        } else {
            println("[WARN] Failed to refresh session info for WebSocket: $webSocketSessionId - userId or nickname still null")
        }
    }
}
