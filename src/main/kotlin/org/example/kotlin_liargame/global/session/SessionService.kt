package org.example.kotlin_liargame.global.session

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.global.exception.SessionAuthenticationException
import org.example.kotlin_liargame.global.util.SessionUtil
import org.springframework.stereotype.Service

@Service
class SessionService(
    private val sessionUtil: SessionUtil
) {

    /**
     * 필수 인증이 필요한 경우 사용
     * 인증되지 않은 경우 예외 발생
     */
    fun getCurrentUserId(session: HttpSession): Long {
        return sessionUtil.getUserId(session)
            ?: throw SessionAuthenticationException()
    }

    /**
     * 선택적 인증인 경우 사용 (관찰자 모드 등)
     * 인증되지 않은 경우 null 반환
     */
    fun getOptionalUserId(session: HttpSession?): Long? {
        return if (session != null) sessionUtil.getUserId(session) else null
    }

    /**
     * 현재 사용자 닉네임 조회
     * 인증되지 않은 경우 예외 발생
     */
    fun getCurrentUserNickname(session: HttpSession): String {
        return sessionUtil.getUserNickname(session)
            ?: throw SessionAuthenticationException()
    }

    /**
     * 선택적 닉네임 조회
     * 인증되지 않은 경우 null 반환
     */
    fun getOptionalUserNickname(session: HttpSession?): String? {
        return if (session != null) sessionUtil.getUserNickname(session) else null
    }

    /**
     * 세션 유효성 검증
     */
    fun isAuthenticated(session: HttpSession?): Boolean {
        return if (session != null) sessionUtil.isAuthenticated(session) else false
    }

    /**
     * 세션 정보 조회 (디버깅용)
     */
    fun getSessionInfo(session: HttpSession?): Map<String, Any?> {
        return mapOf(
            "userId" to getOptionalUserId(session),
            "nickname" to getOptionalUserNickname(session),
            "isAuthenticated" to isAuthenticated(session)
        )
    }
}
