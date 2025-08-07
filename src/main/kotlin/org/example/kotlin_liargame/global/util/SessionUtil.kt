package org.example.kotlin_liargame.global.util

import jakarta.servlet.http.HttpSession
import org.springframework.stereotype.Component

@Component
class SessionUtil {

    fun getUserId(session: HttpSession): Long? {
        return session.getAttribute("userId") as? Long
    }

    fun getUserNickname(session: HttpSession): String? {
        return session.getAttribute("nickname") as? String
    }

    fun isAuthenticated(session: HttpSession): Boolean {
        return getUserId(session) != null
    }

    fun requireUserId(session: HttpSession): Long {
        return getUserId(session) ?: throw IllegalStateException("User not authenticated")
    }

    fun requireUserNickname(session: HttpSession): String {
        return getUserNickname(session) ?: throw IllegalStateException("User not authenticated")
    }
}