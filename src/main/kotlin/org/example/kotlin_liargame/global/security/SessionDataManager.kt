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
     * 세션 데이터를 JSON으로 저장 (세션 유효성 검증 추가)
     */
    fun setSessionData(session: HttpSession, key: String, data: Any) {
        try {
            // 세션 유효성 검증
            if (isSessionInvalid(session)) {
                throw SessionDataException("Cannot set session data - session is invalidated for key: $key")
            }

            val jsonData = objectMapper.writeValueAsString(data)
            session.setAttribute(key, jsonData)

            // flush-mode가 immediate로 설정되어 있으므로 자동으로 Redis에 즉시 반영됨
            // 추가적으로 세션을 터치하여 변경 사항 확실히 반영
            touchSession(session)

        } catch (e: IllegalStateException) {
            throw SessionDataException("Failed to serialize session data for key: $key - session invalidated", e)
        } catch (e: Exception) {
            throw SessionDataException("Failed to serialize session data for key: $key", e)
        }
    }

    /**
     * 세션을 터치하여 변경 사항을 확실히 Redis에 반영
     */
    private fun touchSession(session: HttpSession) {
        try {
            // 세션의 lastAccessedTime을 업데이트하여 변경 사항 반영 보장
            session.setAttribute("_touch", System.currentTimeMillis())
            session.removeAttribute("_touch")
        } catch (e: Exception) {
            // 터치 실패는 로그만 남기고 계속 진행
            println("[WARNING] Failed to touch session: ${e.message}")
        }
    }

    /**
     * 세션에서 JSON 데이터를 객체로 복원 (세션 유효성 검증 추가)
     */
    fun <T> getSessionData(session: HttpSession, key: String, clazz: Class<T>): T? {
        return try {
            // 세션 유효성 검증
            if (isSessionInvalid(session)) {
                return null
            }

            val jsonData = session.getAttribute(key) as? String
            if (jsonData != null) {
                objectMapper.readValue(jsonData, clazz)
            } else {
                null
            }
        } catch (e: IllegalStateException) {
            null // 세션이 무효화된 경우
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

    /**
     * 세션 유효성 검증 헬퍼 메서드
     */
    private fun isSessionInvalid(session: HttpSession): Boolean {
        return try {
            session.id // 세션 ID 접근 시도
            session.creationTime // 세션 생성 시간 접근 시도
            false
        } catch (e: IllegalStateException) {
            true // 세션이 무효화된 경우
        }
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
