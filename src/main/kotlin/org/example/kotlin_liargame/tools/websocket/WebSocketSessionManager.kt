package org.example.kotlin_liargame.tools.websocket

import jakarta.servlet.http.HttpSession
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap

/**
 * WebSocket 세션 관리를 위한 유틸리티 클래스
 */
@Component
class WebSocketSessionManager {
    // WebSocket 세션 ID를 키로, HTTP 세션 정보를 값으로 저장하는 맵
    private val sessionMap = ConcurrentHashMap<String, Map<String, Any>>()

    /**
     * WebSocket 연결 시 HTTP 세션 정보를 저장
     */
    fun storeSession(webSocketSessionId: String, httpSession: HttpSession) {
        val userId = httpSession.getAttribute("userId") as? Long
        val nickname = httpSession.getAttribute("nickname") as? String

        val sessionInfo = mutableMapOf<String, Any>()
        if (userId != null) {
            sessionInfo["userId"] = userId
            println("[DEBUG] Storing WebSocket session mapping: $webSocketSessionId -> userId=$userId")
        } else {
            println("[WARN] No userId found in HTTP session for WebSocket: $webSocketSessionId")
            // HTTP 세션의 모든 속성 출력
            httpSession.attributeNames.asIterator().forEach { attrName ->
                println("[DEBUG] HTTP Session attribute: $attrName = ${httpSession.getAttribute(attrName)}")
            }
        }

        if (nickname != null) {
            sessionInfo["nickname"] = nickname
        }

        if (sessionInfo.isNotEmpty()) {
            sessionMap[webSocketSessionId] = sessionInfo
            println("[DEBUG] WebSocket session stored: $webSocketSessionId -> $sessionInfo")
            printSessionInfo()
        } else {
            println("[WARN] No session info to store for WebSocket: $webSocketSessionId")
        }
    }

    /**
     * WebSocket 세션 ID로 사용자 ID 조회
     */
    fun getUserId(webSocketSessionId: String): Long? {
        return sessionMap[webSocketSessionId]?.get("userId") as? Long
    }

    /**
     * WebSocket 세션 ID로 사용자 닉네임 조회
     */
    fun getNickname(webSocketSessionId: String): String? {
        return sessionMap[webSocketSessionId]?.get("nickname") as? String
    }

    /**
     * WebSocket 메시지 헤더 액세서에 사용자 정보 주입
     */
    fun injectUserInfo(accessor: SimpMessageHeaderAccessor) {
        val sessionId = accessor.sessionId ?: return
        val sessionInfo = sessionMap[sessionId] ?: return

        accessor.sessionAttributes = accessor.sessionAttributes ?: mutableMapOf()

        sessionInfo.forEach { (key, value) ->
            accessor.sessionAttributes!![key] = value
        }
    }

    /**
     * WebSocket 연결 종료 시 세션 정보 제거
     */
    fun removeSession(webSocketSessionId: String) {
        sessionMap.remove(webSocketSessionId)
        println("[DEBUG] Removed WebSocket session: $webSocketSessionId")
    }

    /**
     * 현재 저장된 모든 세션 정보 출력 (디버깅용)
     */
    fun printSessionInfo() {
        println("[DEBUG] Current WebSocket sessions (${sessionMap.size})")
        sessionMap.forEach { (sessionId, info) ->
            println("[DEBUG]   - $sessionId: $info")
        }
    }
}
