package org.example.kotlin_liargame.global.security

import jakarta.servlet.http.HttpSession
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

@Service
class SessionManagementService {

    // 활성 세션 관리 (nickname -> SessionInfo)
    private val activeSessions = ConcurrentHashMap<String, SessionInfo>()

    // 세션 ID -> nickname 매핑
    private val sessionIdToNickname = ConcurrentHashMap<String, String>()

    /**
     * 사용자 로그인 시 세션 등록
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

        // 세션 속성 설정
        session.setAttribute("userId", userId)
        session.setAttribute("nickname", nickname)
        session.setAttribute("loginTime", now)
        session.maxInactiveInterval = 1800 // 30분

        println("[SECURITY] Session registered for user: $nickname (ID: $userId)")
        return SessionRegistrationResult.SUCCESS
    }

    /**
     * 세션 유효성 검증
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

        // 세션 활동 시간 업데이트
        sessionInfo.lastActivity = LocalDateTime.now()

        return SessionValidationResult.VALID
    }

    /**
     * 세션 무효화
     */
    fun invalidateSession(nickname: String) {
        val sessionInfo = activeSessions.remove(nickname)
        if (sessionInfo != null) {
            sessionIdToNickname.remove(sessionInfo.sessionId)
            println("[SECURITY] Session invalidated for user: $nickname")
        }
    }

    /**
     * 세션 ID로 세션 무효화
     */
    fun invalidateSessionById(sessionId: String) {
        val nickname = sessionIdToNickname.remove(sessionId)
        if (nickname != null) {
            activeSessions.remove(nickname)
            println("[SECURITY] Session invalidated by ID: $sessionId")
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