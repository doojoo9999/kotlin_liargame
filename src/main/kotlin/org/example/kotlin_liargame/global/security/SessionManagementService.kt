package org.example.kotlin_liargame.global.security

import jakarta.servlet.http.HttpSession
import org.springframework.security.core.session.SessionRegistry
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap


class SessionManagementService(
    private val sessionDataManager: SessionDataManager,
    private val sessionRegistry: SessionRegistry // Inject SessionRegistry
) {

    private val activeSessions = ConcurrentHashMap<String, SessionInfo>()
    
    private val sessionIdToNickname = ConcurrentHashMap<String, String>()

    fun registerSession(session: HttpSession, nickname: String, userId: Long): SessionRegistrationResult {
        val sessionId = session.id
        val now = LocalDateTime.now()
        
        val existingSession = activeSessions[nickname]
        if (existingSession != null) {
            if (existingSession.sessionId == sessionId) {
                existingSession.lastActivity = now
                return SessionRegistrationResult.SUCCESS
            }
            
            println("[SECURITY] Concurrent login detected for nickname: $nickname. Previous session invalidated.")
            activeSessions.remove(nickname)
            sessionIdToNickname.remove(existingSession.sessionId)
        }
        
        // 새 세션 등록
        val sessionInfo = SessionInfo(
            sessionId = sessionId,
            nickname = nickname,
            userId = userId,
            loginTime = now,
            lastActivity = now,
            ipAddress = getSessionIpAddress(session)
        )
        
        activeSessions[nickname] = sessionInfo
        sessionIdToNickname[sessionId] = nickname
        
        val userSessionData = UserSessionData(
            userId = userId,
            nickname = nickname,
            loginTime = now,
            lastActivity = now,
            ipAddress = getSessionIpAddress(session)
        )
        sessionDataManager.setUserSession(session, userSessionData)

        val sessionMetadata = SessionMetadata(
            sessionId = sessionId,
            userAgent = extractUserAgent(session),
            ipAddress = getSessionIpAddress(session),
            createdAt = now,
            expiresAt = now.plusMinutes(30) // 30분 후 만료
        )
        sessionDataManager.setSessionMetadata(session, sessionMetadata)

        session.maxInactiveInterval = 1800 // 30분
        
        println("[SECURITY] Session registered for user: $nickname (ID: $userId) using JSON serialization")
        return SessionRegistrationResult.SUCCESS
    }

    fun registerAdminSession(session: HttpSession, nickname: String, userId: Long, permissions: Set<String> = emptySet()): SessionRegistrationResult {
        val result = registerSession(session, nickname, userId)

        if (result == SessionRegistrationResult.SUCCESS) {
            val adminSessionData = AdminSessionData(
                userId = userId,
                nickname = nickname,
                isAdmin = true,
                loginTime = LocalDateTime.now(),
                permissions = permissions
            )
            sessionDataManager.setAdminSession(session, adminSessionData)
            println("[SECURITY] Admin session registered for user: $nickname")
        }

        return result
    }


    fun validateSession(session: HttpSession): SessionValidationResult {
        val sessionId = session.id
        val nickname = sessionIdToNickname[sessionId]
        
        if (nickname == null) {
            return SessionValidationResult.NOT_FOUND
        }
        
        val sessionInfo = activeSessions[nickname]
        if (sessionInfo == null || sessionInfo.sessionId != sessionId) {
            sessionIdToNickname.remove(sessionId)
            return SessionValidationResult.INVALID
        }
        
        val userSessionData = sessionDataManager.getUserSession(session)
        if (userSessionData != null) {
            val updatedSessionData = userSessionData.updateLastActivity()
            sessionDataManager.setUserSession(session, updatedSessionData)
        }

        sessionInfo.lastActivity = LocalDateTime.now()
        
        return SessionValidationResult.VALID
    }

    fun updateGameSession(session: HttpSession, gameNumber: Int?, isOwner: Boolean = false, playerRole: String? = null) {
        val gameSessionData = GameSessionData(
            currentGameNumber = gameNumber,
            isGameOwner = isOwner,
            playerRole = playerRole,
            joinedAt = if (gameNumber != null) LocalDateTime.now() else null
        )
        sessionDataManager.setGameSession(session, gameSessionData)
    }

    fun getUserId(session: HttpSession): Long? {
        return sessionDataManager.getUserSession(session)?.userId
    }

    fun getNickname(session: HttpSession): String? {
        return sessionDataManager.getUserSession(session)?.nickname
    }

    fun isAdmin(session: HttpSession): Boolean {
        return sessionDataManager.getAdminSession(session)?.isAdmin ?: false
    }

    fun getCurrentGameNumber(session: HttpSession): Int? {
        return sessionDataManager.getGameSession(session)?.currentGameNumber
    }

    fun invalidateSession(nickname: String) {
        val sessionInfo = activeSessions.remove(nickname)
        if (sessionInfo != null) {
            sessionIdToNickname.remove(sessionInfo.sessionId)
            // Spring Security의 SessionRegistry를 사용하여 실제 HttpSession을 무효화
            sessionRegistry.getSessionInformation(sessionInfo.sessionId)?.expireNow()
            println("[SECURITY] Session invalidated for user: $nickname")
        }
    }
    
    fun invalidateSessionById(sessionId: String) {
        val nickname = sessionIdToNickname.remove(sessionId)
        if (nickname != null) {
            activeSessions.remove(nickname)
            println("[SECURITY] Session invalidated by ID: $sessionId")
        }
    }

    fun logout(session: HttpSession) {
        val userSessionData = sessionDataManager.getUserSession(session)
        if (userSessionData != null) {
            invalidateSession(userSessionData.nickname)
            sessionDataManager.clearUserSession(session)
            session.invalidate()
            println("[SECURITY] User logged out: ${userSessionData.nickname}")
        }
    }


    fun cleanupExpiredSessions() {
        val now = LocalDateTime.now()
        val expiredSessions = mutableListOf<String>()
        
        activeSessions.forEach { (nickname, sessionInfo) ->
            val inactiveMinutes = java.time.Duration.between(sessionInfo.lastActivity, now).toMinutes()
            if (inactiveMinutes > 30) { // 30분 비활성
                expiredSessions.add(nickname)
            }
        }
        
        expiredSessions.forEach { nickname ->
            invalidateSession(nickname)
        }
        
        if (expiredSessions.isNotEmpty()) {
            println("[CLEANUP] Cleaned up ${expiredSessions.size} expired sessions")
        }
    }
    

    fun getActiveSessionInfo(nickname: String): SessionInfo? {
        return activeSessions[nickname]
    }
    

    fun getActiveSessionCount(): Int {
        return activeSessions.size
    }
    

    fun getActiveSessionList(): List<SessionInfo> {
        return activeSessions.values.toList()
    }
    

    private fun getSessionIpAddress(session: HttpSession): String {
        return try {
            "unknown"
        } catch (e: Exception) {
            "unknown"
        }
    }
    

    private fun extractUserAgent(session: HttpSession): String? {
        return try {
            null
        } catch (e: Exception) {
            null
        }
    }

    fun getSessionStatistics(): SessionStatistics {
        val now = LocalDateTime.now()
        var totalSessions = 0
        var activeSessions = 0
        var recentLogins = 0
        
        this.activeSessions.values.forEach { sessionInfo ->
            totalSessions++
            
            val lastActivityMinutes = java.time.Duration.between(sessionInfo.lastActivity, now).toMinutes()
            if (lastActivityMinutes <= 5) {
                activeSessions++
            }
            
            val loginMinutes = java.time.Duration.between(sessionInfo.loginTime, now).toMinutes()
            if (loginMinutes <= 60) {
                recentLogins++
            }
        }
        
        return SessionStatistics(
            totalSessions = totalSessions,
            activeInLast5Minutes = activeSessions,
            loginsInLastHour = recentLogins
        )
    }
}

data class SessionInfo(
    val sessionId: String,
    val nickname: String,
    val userId: Long,
    val loginTime: LocalDateTime,
    var lastActivity: LocalDateTime,
    val ipAddress: String
)

enum class SessionRegistrationResult {
    SUCCESS,
    CONCURRENT_SESSION_REPLACED
}

enum class SessionValidationResult {
    VALID,
    INVALID,
    NOT_FOUND,
    EXPIRED
}

data class SessionStatistics(
    val totalSessions: Int,
    val activeInLast5Minutes: Int,
    val loginsInLastHour: Int
)