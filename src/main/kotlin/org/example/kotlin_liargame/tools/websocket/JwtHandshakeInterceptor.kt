package org.example.kotlin_liargame.tools.websocket

import org.example.kotlin_liargame.tools.security.jwt.JwtProvider
import org.springframework.http.server.ServerHttpRequest
import org.springframework.http.server.ServerHttpResponse
import org.springframework.http.server.ServletServerHttpRequest
import org.springframework.web.socket.WebSocketHandler
import org.springframework.web.socket.server.HandshakeInterceptor

class JwtHandshakeInterceptor(
    private val jwtProvider: JwtProvider
) : HandshakeInterceptor {

    override fun beforeHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        attributes: MutableMap<String, Any>
    ): Boolean {
        if (request is ServletServerHttpRequest) {
            try {
                // Authorization 헤더에서 JWT 토큰 추출
                val authHeader = request.servletRequest.getHeader("Authorization")
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    val token = authHeader.substring(7)

                    // 토큰 검증
                    if (jwtProvider.validateToken(token) && jwtProvider.isTokenInDatabase(token)) {
                        val claims = jwtProvider.getClaims(token)
                        val userId = claims.subject.toLong()
                        val nickname = claims.get("nickname", String::class.java)

                        // WebSocket 세션에 사용자 정보 저장
                        attributes["userId"] = userId
                        attributes["nickname"] = nickname
                        attributes["token"] = token

                        println("[DEBUG] WebSocket handshake successful for user: $nickname (ID: $userId)")
                        return true
                    }
                }

                // JWT가 없거나 유효하지 않은 경우, 테스트 사용자로 처리 (개발용)
                println("[DEBUG] WebSocket handshake with test user")
                attributes["userId"] = 1L
                attributes["nickname"] = "TestUser"
                return true

            } catch (e: Exception) {
                println("[ERROR] WebSocket handshake failed: ${e.message}")
                return false
            }
        }
        return true
    }

    override fun afterHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        exception: Exception?
    ) {
        // 핸드셰이크 완료 후 처리
        if (exception != null) {
            println("[ERROR] WebSocket handshake completed with exception: ${exception.message}")
        } else {
            println("[DEBUG] WebSocket handshake completed successfully")
        }
    }
}

