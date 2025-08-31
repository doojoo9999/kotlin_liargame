package org.example.kotlin_liargame.global.security

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import jakarta.servlet.http.HttpSession
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class SessionDataManager(
    private val objectMapper: ObjectMapper
) {

    init {
        // LocalDateTime 직렬화를 위한 모듈 등록
        objectMapper.registerModule(JavaTimeModule())
    }

    /**
     * 세션 데이터를 JSON으로 저장
     */
    fun setSessionData(session: HttpSession, key: String, data: Any) {
        try {
            val jsonData = objectMapper.writeValueAsString(data)
            session.setAttribute(key, jsonData)
        } catch (e: Exception) {
            throw SessionDataException("Failed to serialize session data for key: $key", e)
        }
    }

    /**
     * 세션에서 JSON 데이터를 객체로 복원
     */
    fun <T> getSessionData(session: HttpSession, key: String, clazz: Class<T>): T? {
        return try {
            val jsonData = session.getAttribute(key) as? String
            if (jsonData != null) {
                objectMapper.readValue(jsonData, clazz)
            } else {
                null
            }
        } catch (e: Exception) {
            throw SessionDataException("Failed to deserialize session data for key: $key", e)
        }
    }

    /**
     * 사용자 세션 정보 저장 (JSON 직렬화)
     */
    fun setUserSession(session: HttpSession, userSessionData: UserSessionData) {
        setSessionData(session, SESSION_USER_KEY, userSessionData)
    }

    /**
     * 사용자 세션 정보 조회 (JSON 역직렬화)
     */
    fun getUserSession(session: HttpSession): UserSessionData? {
        return getSessionData(session, SESSION_USER_KEY, UserSessionData::class.java)
    }

    /**
     * 관리자 세션 정보 저장
     */
    fun setAdminSession(session: HttpSession, adminSessionData: AdminSessionData) {
        setSessionData(session, SESSION_ADMIN_KEY, adminSessionData)
    }

    /**
     * 관리자 세션 정보 조회
     */
    fun getAdminSession(session: HttpSession): AdminSessionData? {
        return getSessionData(session, SESSION_ADMIN_KEY, AdminSessionData::class.java)
    }

    /**
     * 게임 관련 세션 데이터 저장
     */
    fun setGameSession(session: HttpSession, gameSessionData: GameSessionData) {
        setSessionData(session, SESSION_GAME_KEY, gameSessionData)
    }

    /**
     * 게임 관련 세션 데이터 조회
     */
    fun getGameSession(session: HttpSession): GameSessionData? {
        return getSessionData(session, SESSION_GAME_KEY, GameSessionData::class.java)
    }

    /**
     * 세션 데이터 삭제
     */
    fun removeSessionData(session: HttpSession, key: String) {
        session.removeAttribute(key)
    }

    /**
     * 전체 사용자 세션 정보 삭제
     */
    fun clearUserSession(session: HttpSession) {
        removeSessionData(session, SESSION_USER_KEY)
        removeSessionData(session, SESSION_ADMIN_KEY)
        removeSessionData(session, SESSION_GAME_KEY)
    }

    /**
     * 세션 메타데이터 설정
     */
    fun setSessionMetadata(session: HttpSession, metadata: SessionMetadata) {
        setSessionData(session, SESSION_METADATA_KEY, metadata)
    }

    /**
     * 세션 메타데이터 조회
     */
    fun getSessionMetadata(session: HttpSession): SessionMetadata? {
        return getSessionData(session, SESSION_METADATA_KEY, SessionMetadata::class.java)
    }

    companion object {
        private const val SESSION_USER_KEY = "session_user_data"
        private const val SESSION_ADMIN_KEY = "session_admin_data"
        private const val SESSION_GAME_KEY = "session_game_data"
        private const val SESSION_METADATA_KEY = "session_metadata"
    }
}

/**
 * 사용자 세션 데이터
 */
data class UserSessionData(
    val userId: Long,
    val nickname: String,
    val loginTime: LocalDateTime = LocalDateTime.now(),
    val lastActivity: LocalDateTime = LocalDateTime.now(),
    val ipAddress: String? = null
) {
    fun updateLastActivity(): UserSessionData {
        return this.copy(lastActivity = LocalDateTime.now())
    }
}

/**
 * 관리자 세션 데이터
 */
data class AdminSessionData(
    val userId: Long,
    val nickname: String,
    val isAdmin: Boolean = true,
    val loginTime: LocalDateTime = LocalDateTime.now(),
    val permissions: Set<String> = emptySet()
)

/**
 * 게임 관련 세션 데이터
 */
data class GameSessionData(
    val currentGameNumber: Int? = null,
    val isGameOwner: Boolean = false,
    val playerRole: String? = null,
    val joinedAt: LocalDateTime? = null
)

/**
 * 세션 메타데이터
 */
data class SessionMetadata(
    val sessionId: String,
    val userAgent: String? = null,
    val ipAddress: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val expiresAt: LocalDateTime? = null
)

/**
 * 세션 데이터 예외
 */
class SessionDataException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
