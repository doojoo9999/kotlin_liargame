package org.example.kotlin_liargame.global.util

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.global.security.SessionDataManager
import org.springframework.stereotype.Component

@Component
class SessionUtil(
    private val sessionDataManager: SessionDataManager
) {

    fun getUserId(session: HttpSession): Long? {
        return sessionDataManager.getUserSession(session)?.userId
    }

    fun getUserNickname(session: HttpSession): String? {
        return sessionDataManager.getUserSession(session)?.nickname
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

    fun isAdmin(session: HttpSession): Boolean {
        return sessionDataManager.getAdminSession(session)?.isAdmin ?: false
    }

    fun getCurrentGameNumber(session: HttpSession): Int? {
        return sessionDataManager.getGameSession(session)?.currentGameNumber
    }

    fun isGameOwner(session: HttpSession): Boolean {
        return sessionDataManager.getGameSession(session)?.isGameOwner ?: false
    }

    fun getPlayerRole(session: HttpSession): String? {
        return sessionDataManager.getGameSession(session)?.playerRole
    }
}