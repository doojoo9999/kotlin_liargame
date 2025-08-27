package org.example.kotlin_liargame.global.session

import jakarta.servlet.http.HttpSession
import org.springframework.stereotype.Service

@Service
class SessionService {

    /**
     * 필수 인증이 필요한 경우 사용
     * 인증되지 않은 경우 예외 발생
     */
    fun getCurrentUserId(session: HttpSession): Long {
        return session.getAttribute("userId") as? Long
            ?: throw RuntimeException("Not authenticated")
    }

    /**
     * 선택적 인증인 경우 사용 (관찰자 모드 등)
     * 인증되지 않은 경우 null 반환
     */
    fun getOptionalUserId(session: HttpSession?): Long? {
        return session?.getAttribute("userId") as? Long
    }

    /**
     * 현재 사용자 닉네임 조회
     * 인증되지 않은 경우 예외 발생
     */
    fun getCurrentUserNickname(session: HttpSession): String {
        return session.getAttribute("nickname") as? String
            ?: throw RuntimeException("Not authenticated")
    }

    /**
     * 선택적 닉네임 조회
     * 인증되지 않은 경우 null 반환
     */
    fun getOptionalUserNickname(session: HttpSession?): String? {
        return session?.getAttribute("nickname") as? String
    }

    /**
     * 세션 유효성 검증
     */
    fun isAuthenticated(session: HttpSession?): Boolean {
        return session?.getAttribute("userId") != null
    }

    /**
     * 세션 정보 조회 (디버깅용)
     */
    fun getSessionInfo(session: HttpSession?): Map<String, Any?> {
        return mapOf(
            "userId" to session?.getAttribute("userId"),
            "nickname" to session?.getAttribute("nickname"),
            "isAuthenticated" to isAuthenticated(session)
        )
    }
}
