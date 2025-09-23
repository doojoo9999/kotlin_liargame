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
        try {
            val sessionId = session.id
            val now = LocalDateTime.now()

            // 기존 세션이 있는지 확인하고 처리
            val existingSession = activeSessions[nickname]
            if (existingSession != null) {
                if (existingSession.sessionId == sessionId) {
                    // 같은 세션이면 활동 시간만 업데이트
                    existingSession.lastActivity = now
                    return SessionRegistrationResult.SUCCESS
                }

                println("[SECURITY] Concurrent login detected for nickname: $nickname. Previous session invalidated.")
                // 기존 세션 정보를 메모리에서 제거
                activeSessions.remove(nickname)
                sessionIdToNickname.remove(existingSession.sessionId)

                // Spring Security의 SessionRegistry에서도 기존 세션 제거
                sessionRegistry.getAllSessions(nickname, false).forEach { sessionInfo ->
                    sessionInfo.expireNow()
                }
            }

            // 새 세션 등록 전에 세션 유효성 확인
            if (isSessionInvalid(session)) {
                println("[ERROR] Cannot register session - session is already invalidated")
                return SessionRegistrationResult.FAILED
            }

            // 새 세션 정보 생성
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

            // 세션 데이터 저장 (예외 처리 추가)
            try {
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
                    expiresAt = now.plusMinutes(30)
                )
                sessionDataManager.setSessionMetadata(session, sessionMetadata)

                session.maxInactiveInterval = 1800 // 30분

                println("[SECURITY] Session registered for user: $nickname (ID: $userId) using JSON serialization")
                return SessionRegistrationResult.SUCCESS

            } catch (e: Exception) {
                println("[ERROR] Failed to set session data: ${e.message}")
                // 세션 데이터 설정 실패 시 메모리에서 세션 정보 제거
                activeSessions.remove(nickname)
                sessionIdToNickname.remove(sessionId)
                return SessionRegistrationResult.FAILED
            }

        } catch (e: Exception) {
            println("[ERROR] Session registration failed for user $nickname: ${e.message}")
            return SessionRegistrationResult.FAILED
        }
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
        val storedUserSession = sessionDataManager.getUserSession(session)
        val sessionMetadata = sessionDataManager.getSessionMetadata(session)

        var nickname = sessionIdToNickname[sessionId]
        var sessionInfo = nickname?.let { activeSessions[it] }

        if (sessionInfo == null || sessionInfo.sessionId != sessionId) {
            if (storedUserSession == null) {
                nickname?.let { activeSessions.remove(it) }
                sessionIdToNickname.remove(sessionId)
                return SessionValidationResult.NOT_FOUND
            }

            nickname = storedUserSession.nickname
            sessionInfo = SessionInfo(
                sessionId = sessionId,
                nickname = nickname,
                userId = storedUserSession.userId,
                loginTime = storedUserSession.loginTime,
                lastActivity = storedUserSession.lastActivity,
                ipAddress = sessionMetadata?.ipAddress ?: storedUserSession.ipAddress ?: "unknown"
            )

            val previousSession = activeSessions.put(nickname, sessionInfo)
            if (previousSession != null && previousSession.sessionId != sessionId) {
                sessionIdToNickname.remove(previousSession.sessionId)
            }
            sessionIdToNickname[sessionId] = nickname
        }

        if (sessionInfo.sessionId != sessionId) {
            sessionIdToNickname.remove(sessionId)
            return SessionValidationResult.INVALID
        }

        val updatedSessionData = storedUserSession?.updateLastActivity()
        if (updatedSessionData != null) {
            sessionDataManager.setUserSession(session, updatedSessionData)
            sessionInfo.lastActivity = updatedSessionData.lastActivity
        } else {
            sessionInfo.lastActivity = LocalDateTime.now()
        }

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

    fun getCurrentUserId(session: HttpSession): Long? {
        return getUserId(session)
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
    

    fun rehydrateSession(session: HttpSession, existingInfo: SessionInfo? = null): Boolean {
        val sessionInfo = existingInfo ?: getSessionInfoById(session.id) ?: return false

        return try {
            val userSessionData = UserSessionData(
                userId = sessionInfo.userId,
                nickname = sessionInfo.nickname,
                loginTime = sessionInfo.loginTime,
                lastActivity = sessionInfo.lastActivity,
                ipAddress = sessionInfo.ipAddress
            )
            sessionDataManager.setUserSession(session, userSessionData)

            sessionDataManager.setSessionMetadata(
                session,
                SessionMetadata(
                    sessionId = sessionInfo.sessionId,
                    userAgent = extractUserAgent(session),
                    ipAddress = sessionInfo.ipAddress,
                    createdAt = sessionInfo.loginTime,
                    expiresAt = sessionInfo.lastActivity.plusMinutes(30)
                )
            )
            true
        } catch (e: Exception) {
            println("[WARN] Failed to rehydrate session ${session.id}: ${e.message}")
            false
        }
    }

    fun getSessionInfoById(sessionId: String): SessionInfo? {
        val nickname = sessionIdToNickname[sessionId] ?: return null
        return activeSessions[nickname]
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
    

    // 세션 유효성 확인 헬퍼 메서드
    private fun isSessionInvalid(session: HttpSession): Boolean {
        return try {
            session.id // 세션 ID 접근 시도
            session.creationTime // 세션 생성 시간 접근 시도
            false
        } catch (e: IllegalStateException) {
            true // 세션이 무효화된 경우
        }
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
    CONCURRENT_SESSION_REPLACED,
    FAILED
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

