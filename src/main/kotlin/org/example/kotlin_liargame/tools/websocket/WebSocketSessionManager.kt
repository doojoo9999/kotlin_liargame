package org.example.kotlin_liargame.tools.websocket

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.global.security.SessionInfo
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.example.kotlin_liargame.global.util.SessionUtil
import org.slf4j.LoggerFactory
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet

@Component
class WebSocketSessionManager(
    private val sessionUtil: SessionUtil,
    private val sessionManagementService: SessionManagementService
) {
    private val logger = LoggerFactory.getLogger(WebSocketSessionManager::class.java)

    private val sessionMap = ConcurrentHashMap<String, SessionSnapshot>()
    private val userSessions = ConcurrentHashMap<Long, MutableSet<String>>()
    private val playerGameMap = ConcurrentHashMap<Long, Int>()

    fun storeSession(webSocketSessionId: String, httpSession: HttpSession) {
        val userId = resolveUserId(httpSession, webSocketSessionId) ?: return
        storeSnapshot(
            webSocketSessionId = webSocketSessionId,
            userId = userId,
            nickname = sessionUtil.getUserNickname(httpSession),
            httpSessionId = httpSession.id
        )
    }

    fun storeSession(webSocketSessionId: String, sessionInfo: SessionInfo) {
        storeSnapshot(
            webSocketSessionId = webSocketSessionId,
            userId = sessionInfo.userId,
            nickname = sessionInfo.nickname,
            httpSessionId = sessionInfo.sessionId
        )
    }

    private fun storeSnapshot(
        webSocketSessionId: String,
        userId: Long,
        nickname: String?,
        httpSessionId: String
    ) {
        val snapshot = SessionSnapshot(
            sessionId = webSocketSessionId,
            userId = userId,
            nickname = nickname,
            httpSessionId = httpSessionId,
            connectedAt = Instant.now()
        )

        sessionMap[webSocketSessionId] = snapshot
        userSessions.computeIfAbsent(userId) { CopyOnWriteArraySet() }.add(webSocketSessionId)
        logger.debug("Stored WebSocket session {} for user {} (nickname={})", webSocketSessionId, userId, nickname)
    }

    fun removeSession(webSocketSessionId: String): SessionSnapshot? {
        val snapshot = sessionMap.remove(webSocketSessionId)
        if (snapshot != null) {
            userSessions[snapshot.userId]?.remove(webSocketSessionId)
            if (userSessions[snapshot.userId]?.isEmpty() == true) {
                userSessions.remove(snapshot.userId)
            }
            logger.debug("Removed WebSocket session {} for user {}", webSocketSessionId, snapshot.userId)
        } else {
            logger.debug("Attempted to remove unknown WebSocket session {}", webSocketSessionId)
        }
        return snapshot
    }

    fun getSession(webSocketSessionId: String): SessionSnapshot? = sessionMap[webSocketSessionId]

    fun getSessionsForUser(userId: Long): Set<String> = userSessions[userId]?.toSet() ?: emptySet()

    fun getUserId(webSocketSessionId: String): Long? = sessionMap[webSocketSessionId]?.userId

    fun getNickname(webSocketSessionId: String): String? = sessionMap[webSocketSessionId]?.nickname

    fun injectUserInfo(accessor: SimpMessageHeaderAccessor) {
        val sessionId = accessor.sessionId ?: return
        val snapshot = sessionMap[sessionId] ?: return

        accessor.sessionAttributes = accessor.sessionAttributes ?: mutableMapOf()
        accessor.sessionAttributes!!["userId"] = snapshot.userId
        snapshot.nickname?.let { accessor.sessionAttributes!!["nickname"] = it }
    }

    fun registerPlayerInGame(userId: Long, gameNumber: Int) {
        playerGameMap[userId] = gameNumber
        logger.debug("Registered user {} in game {}", userId, gameNumber)
    }

    fun removePlayerFromGame(userId: Long) {
        val removed = playerGameMap.remove(userId)
        if (removed != null) {
            logger.debug("Removed user {} from tracked game {}", userId, removed)
        }
    }

    fun getPlayerGame(userId: Long): Int? = playerGameMap[userId]

    fun refreshSessionInfo(webSocketSessionId: String, httpSession: HttpSession) {
        val current = sessionMap[webSocketSessionId]
        val userId = sessionUtil.getUserId(httpSession)
        val nickname = sessionUtil.getUserNickname(httpSession)

        if (current != null && userId != null) {
            sessionMap[webSocketSessionId] = current.copy(
                userId = userId,
                nickname = nickname,
                lastRefreshedAt = Instant.now()
            )
            logger.debug("Refreshed WebSocket session {} -> userId={}, nickname={}", webSocketSessionId, userId, nickname)
        } else {
            logger.warn("Failed to refresh WebSocket session {} - userId or existing snapshot missing", webSocketSessionId)
        }
    }

    fun refreshSessionsForUser(userId: Long, httpSession: HttpSession) {
        val sessionIds = getSessionsForUser(userId)
        if (sessionIds.isEmpty()) {
            logger.debug("No active WebSocket sessions found to refresh for user {}", userId)
            return
        }
        sessionIds.forEach { refreshSessionInfo(it, httpSession) }
    }

    fun getActiveSessionCount(): Int = sessionMap.size

    private fun resolveUserId(httpSession: HttpSession, sessionId: String): Long? {
        var userId = sessionUtil.getUserId(httpSession)
        if (userId != null) {
            return userId
        }

        logger.warn("Initial session data not found for WebSocket {}, retrying...", sessionId)
        sleepSafely(50)
        userId = sessionUtil.getUserId(httpSession)
        if (userId != null) {
            return userId
        }

        sleepSafely(100)
        userId = sessionUtil.getUserId(httpSession)
        if (userId != null) {
            return userId
        }

        sessionManagementService.getSessionInfoById(httpSession.id)?.let { info ->
            if (sessionManagementService.rehydrateSession(httpSession, info)) {
                return info.userId
            }
        }

        logger.warn("No userId found in HTTP session for WebSocket {} even after retries", sessionId)
        return null
    }

    private fun sleepSafely(millis: Long) {
        try {
            Thread.sleep(millis)
        } catch (ie: InterruptedException) {
            Thread.currentThread().interrupt()
        }
    }

    data class SessionSnapshot(
        val sessionId: String,
        val userId: Long,
        val nickname: String?,
        val httpSessionId: String,
        val connectedAt: Instant,
        val lastRefreshedAt: Instant = connectedAt
    )
}
