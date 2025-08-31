package org.example.kotlin_liargame.global.security

import jakarta.servlet.http.HttpSession
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

@Service
class SessionManagementService(
    private val sessionDataManager: SessionDataManager
) {

    // 활성 세션 관리 (nickname -> SessionInfo)
    private val activeSessions = ConcurrentHashMap<String, SessionInfo>()
    
    // 세션 ID -> nickname 매핑
    private val sessionIdToNickname = ConcurrentHashMap<String, String>()
    
    /**
     * 사용자 로그인 시 세션 등록 (JSON 직렬화 방식)
     */
    fun registerSession(session: HttpSession, nickname: String, userId: Long): SessionRegistrationResult {
        val sessionId = session.id
        val now = LocalDateTime.now()
        
        // 기존 세션 확인
        val existingSession = activeSessions[nickname]
        if (existingSession != null) {
            // 같은 세션 ID인 경우 업데이트
            if (existingSession.sessionId == sessionId) {
                existingSession.lastActivity = now
                return SessionRegistrationResult.SUCCESS
            }
            
            // 다른 세션 ID인 경우 기존 세션 무효화
            invalidateSession(nickname)
            println("[SECURITY] Concurrent login detected for nickname: $nickname. Previous session invalidated.")
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
        
        // JSON 직렬화로 세션 데이터 저장
        val userSessionData = UserSessionData(
            userId = userId,
            nickname = nickname,
            loginTime = now,
            lastActivity = now,
            ipAddress = getSessionIpAddress(session)
        )
        sessionDataManager.setUserSession(session, userSessionData)

        // 세션 메타데이터 저장
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
    
    /**
     * 관리자 세션 등록 (JSON 직렬화 방식)
     */
    fun registerAdminSession(session: HttpSession, nickname: String, userId: Long, permissions: Set<String> = emptySet()): SessionRegistrationResult {
        val result = registerSession(session, nickname, userId)

        if (result == SessionRegistrationResult.SUCCESS) {
            // 관리자 세션 데이터 추가 저장
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

    /**
     * 세션 유효성 검증 (JSON 역직렬화 방식)
     */
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
        
        // JSON에서 사용자 세션 데이터 조회 및 활동 시간 업데이트
        val userSessionData = sessionDataManager.getUserSession(session)
        if (userSessionData != null) {
            val updatedSessionData = userSessionData.updateLastActivity()
            sessionDataManager.setUserSession(session, updatedSessionData)
        }

        // 메모리의 세션 활동 시간도 업데이트
        sessionInfo.lastActivity = LocalDateTime.now()
        
        return SessionValidationResult.VALID
    }
    
    /**
     * 게임 관련 세션 정보 업데이트
     */
    fun updateGameSession(session: HttpSession, gameNumber: Int?, isOwner: Boolean = false, playerRole: String? = null) {
        val gameSessionData = GameSessionData(
            currentGameNumber = gameNumber,
            isGameOwner = isOwner,
            playerRole = playerRole,
            joinedAt = if (gameNumber != null) LocalDateTime.now() else null
        )
        sessionDataManager.setGameSession(session, gameSessionData)
    }

    /**
     * 사용자 ID 조회 (JSON 역직렬화)
     */
    fun getUserId(session: HttpSession): Long? {
        return sessionDataManager.getUserSession(session)?.userId
    }

    /**
     * 닉네임 조회 (JSON 역직렬화)
     */
    fun getNickname(session: HttpSession): String? {
        return sessionDataManager.getUserSession(session)?.nickname
    }

    /**
     * 관리자 여부 확인 (JSON 역직렬화)
     */
    fun isAdmin(session: HttpSession): Boolean {
        return sessionDataManager.getAdminSession(session)?.isAdmin ?: false
    }

    /**
     * 현재 게임 번호 조회 (JSON 역직렬화)
     */
    fun getCurrentGameNumber(session: HttpSession): Int? {
        return sessionDataManager.getGameSession(session)?.currentGameNumber
    }

    /**
     * 세션 무효화 (JSON 데이터도 함께 삭제)
     */
    fun invalidateSession(nickname: String) {
        val sessionInfo = activeSessions.remove(nickname)
        if (sessionInfo != null) {
            sessionIdToNickname.remove(sessionInfo.sessionId)
            println("[SECURITY] Session invalidated for user: $nickname")
        }
    }
    
    /**
     * 세션 ID로 세션 무효화 (JSON 데이터도 함께 삭제)
     */
    fun invalidateSessionById(sessionId: String) {
        val nickname = sessionIdToNickname.remove(sessionId)
        if (nickname != null) {
            activeSessions.remove(nickname)
            println("[SECURITY] Session invalidated by ID: $sessionId")
        }
    }
    
    /**
     * 로그아웃 처리 (JSON 세션 데이터 완전 삭제)
     */
    fun logout(session: HttpSession) {
        val userSessionData = sessionDataManager.getUserSession(session)
        if (userSessionData != null) {
            invalidateSession(userSessionData.nickname)
            sessionDataManager.clearUserSession(session)
            session.invalidate()
            println("[SECURITY] User logged out: ${userSessionData.nickname}")
        }
    }

    /**
     * 만료된 세션 정리
     */
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
    
    /**
     * 활성 세션 정보 조회
     */
    fun getActiveSessionInfo(nickname: String): SessionInfo? {
        return activeSessions[nickname]
    }
    
    /**
     * 전체 활성 세션 수 조회
     */
    fun getActiveSessionCount(): Int {
        return activeSessions.size
    }
    
    /**
     * 활성 세션 목록 조회 (관리자용)
     */
    fun getActiveSessionList(): List<SessionInfo> {
        return activeSessions.values.toList()
    }
    
    /**
     * 세션에서 IP 주소 추출
     */
    private fun getSessionIpAddress(session: HttpSession): String {
        return try {
            // ServletRequest에서 IP 주소를 가져오는 것은 세션에서 직접 불가능
            // 실제 구현에서는 로그인 시점에 IP를 전달받아야 함
            "unknown"
        } catch (e: Exception) {
            "unknown"
        }
    }
    
    /**
     * User-Agent 추출
     */
    private fun extractUserAgent(session: HttpSession): String? {
        return try {
            // 실제 구현에서는 HttpServletRequest에서 User-Agent를 추출
            null
        } catch (e: Exception) {
            null
        }
    }

    /**
     * 사용자별 세션 통계
     */
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