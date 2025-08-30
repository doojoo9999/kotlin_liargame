package org.example.kotlin_liargame.tools.websocket

import org.example.kotlin_liargame.global.security.RateLimitingService
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Lazy
import org.springframework.http.server.ServerHttpRequest
import org.springframework.http.server.ServerHttpResponse
import org.springframework.http.server.ServletServerHttpRequest
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.web.socket.WebSocketHandler
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer
import org.springframework.web.socket.server.HandshakeInterceptor

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val webSocketSessionManager: WebSocketSessionManager,
    private val rateLimitingService: RateLimitingService,
    @Lazy private val connectionManager: WebSocketConnectionManager,
    @Lazy private val webSocketActivityInterceptor: WebSocketActivityInterceptor,
    @Value("\${ratelimit.enabled:true}") private val rateLimitEnabled: Boolean
) : WebSocketMessageBrokerConfigurer {
    
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        config.enableSimpleBroker("/topic")
        config.setApplicationDestinationPrefixes("/app") // "/chat" 프리픽스 제거
    }
    
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(*getAllowedOriginPatterns())
            .addInterceptors(object : HandshakeInterceptor {
                override fun beforeHandshake(
                    request: ServerHttpRequest,
                    response: ServerHttpResponse,
                    wsHandler: WebSocketHandler,
                    attributes: MutableMap<String, Any>
                ): Boolean {
                    if (request is ServletServerHttpRequest) {
                        val httpSession = request.servletRequest.session
                        if (httpSession != null) {
                            attributes["HTTP.SESSION"] = httpSession
                        } else {
                            println("[WARN] No HTTP session found during WebSocket handshake")
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
                    if (exception != null) {
                        println("[ERROR] WebSocket handshake failed: ${exception.message}")
                    }
                }
            })
            .withSockJS()
    }
    
    private fun getAllowedOriginPatterns(): Array<String> {
        val profile = System.getProperty("spring.profiles.active") ?: "dev"

        return when (profile) {
            "prod" -> arrayOf(
                "https://liargame.com",
                "https://www.liargame.com",
                "https://api.liargame.com"
            )
            "staging" -> arrayOf(
                "https://staging.liargame.com",
                "http://119.201.53.4:3000",
                "http://119.201.53.4:5173"
            )
            else -> arrayOf(
                "http://119.201.53.4:3000",
                "http://119.201.53.4:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173"
            )
        }
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(
            webSocketActivityInterceptor, // 활동 감지 인터셉터 추가
            object : ChannelInterceptor {
                override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
                    val accessor = StompHeaderAccessor.wrap(message)

                    when (accessor.command) {
                        StompCommand.CONNECT -> {
                            val sessionId = accessor.sessionId

                            try {
                                val httpSession = accessor.sessionAttributes?.get("HTTP.SESSION") as? jakarta.servlet.http.HttpSession

                                if (httpSession != null) {
                                    // HTTP 세션에서 최신 사용자 정보 가져오기
                                    val userId = httpSession.getAttribute("userId") as? Long
                                    val nickname = httpSession.getAttribute("nickname") as? String

                                    if (userId != null) {
                                        // WebSocket 세션 속성을 HTTP 세션의 최신 정보로 업데이트
                                        accessor.sessionAttributes = accessor.sessionAttributes ?: mutableMapOf()
                                        accessor.sessionAttributes!!["userId"] = userId

                                        if (nickname != null) {
                                            accessor.sessionAttributes!!["nickname"] = nickname
                                        }

                                        println("[CONNECTION] WebSocket connected: sessionId=$sessionId, userId=$userId, nickname=$nickname")

                                        // WebSocketSessionManager에 최신 정보 저장
                                        sessionId?.let { wsSessionId ->
                                            webSocketSessionManager.storeSession(wsSessionId, httpSession)
                                        }
                                    } else {
                                        println("[WARN] No userId found in HTTP session")
                                    }

                                    // Register connection with ConnectionManager
                                    sessionId?.let { wsSessionId ->
                                        connectionManager.registerConnection(wsSessionId, userId)
                                    }
                                } else {
                                    println("[WARN] No HTTP session found in WebSocket connection")
                                }
                            } catch (e: Exception) {
                                println("[ERROR] Failed to extract userId from HTTP session: ${e.message}")
                            }
                        }

                        StompCommand.SEND -> {
                            val sessionId = accessor.sessionId
                            if (sessionId != null) {
                                // Rate limiting 검사
                                val clientId = getWebSocketClientId(accessor)
                                if (rateLimitEnabled && !rateLimitingService.isWebSocketMessageAllowed(clientId)) {
                                    println("[SECURITY] WebSocket rate limit exceeded for client: $clientId")
                                    return null
                                }

                                webSocketSessionManager.injectUserInfo(accessor)
                                // 빈번한 SEND 메시지 로그 제거
                            }
                        }

                        StompCommand.DISCONNECT -> {
                            val sessionId = accessor.sessionId
                            if (sessionId != null) {
                                webSocketSessionManager.removeSession(sessionId)
                                connectionManager.handleDisconnection(sessionId)
                                println("[CONNECTION] WebSocket disconnected: $sessionId")
                            }
                        }

                        else -> {}
                    }

                    return message
                }
            }
        )
    }
    
    /**
     * WebSocket 클라이언트 식별자 추출
     */
    private fun getWebSocketClientId(accessor: StompHeaderAccessor): String {
        val sessionAttributes = accessor.sessionAttributes
        
        // 1. 사용자 ID 우선 사용
        val userId = sessionAttributes?.get("userId") as? Long
        if (userId != null) {
            return "user:$userId"
        }
        
        // 2. WebSocket 세션 ID 사용
        val sessionId = accessor.sessionId
        if (sessionId != null) {
            return "ws:$sessionId"
        }
        
        // 3. 기본값
        return "unknown:${System.currentTimeMillis()}"
    }
}