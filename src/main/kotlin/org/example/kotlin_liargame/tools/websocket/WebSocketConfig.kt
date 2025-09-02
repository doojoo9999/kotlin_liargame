package org.example.kotlin_liargame.tools.websocket

import org.example.kotlin_liargame.global.security.RateLimitingService
import org.slf4j.LoggerFactory
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
    private val sessionUtil: org.example.kotlin_liargame.global.util.SessionUtil,
    @Value("\${ratelimit.enabled:true}") private val rateLimitEnabled: Boolean
) : WebSocketMessageBrokerConfigurer {
    private val log = LoggerFactory.getLogger(WebSocketConfig::class.java)
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        config.enableSimpleBroker("/topic")
        config.setApplicationDestinationPrefixes("/app")
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
                            log.warn("No HTTP session found during WebSocket handshake")
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
                        log.error("WebSocket handshake failed: {}", exception.message)
                    }
                }
            })
            .withSockJS()
    }

    private fun getAllowedOriginPatterns(): Array<String> {
        // 1순위: 환경변수 CORS_ALLOWED_ORIGINS (콤마 구분)
        val envOverride = System.getenv("CORS_ALLOWED_ORIGINS")?.trim()
        if (!envOverride.isNullOrBlank()) {
            return envOverride.split(',').map { it.trim() }.filter { it.isNotEmpty() }.toTypedArray()
        }
        val profile = System.getProperty("spring.profiles.active") ?: "dev"

        return when (profile) {
            "prod" -> arrayOf("https://liargame.com", "https://www.liargame.com", "https://api.liargame.com")
            "staging" -> arrayOf("https://staging.liargame.com", "http://localhost:3000", "http://localhost:5173")
            else -> arrayOf(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173"
            )
        }
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(
            webSocketActivityInterceptor,
            object : ChannelInterceptor {
                override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
                    val accessor = StompHeaderAccessor.wrap(message)
                    when (accessor.command) {
                        StompCommand.CONNECT -> {
                            val sessionId = accessor.sessionId
                            try {
                                val httpSession = accessor.sessionAttributes?.get("HTTP.SESSION") as? jakarta.servlet.http.HttpSession
                                if (httpSession != null) {
                                    var userId = sessionUtil.getUserId(httpSession)
                                    var nickname = sessionUtil.getUserNickname(httpSession)
                                    if (userId == null || nickname == null) {
                                        Thread.sleep(50)
                                        userId = sessionUtil.getUserId(httpSession)
                                        nickname = sessionUtil.getUserNickname(httpSession)
                                        if (userId == null || nickname == null) {
                                            Thread.sleep(100)
                                            userId = sessionUtil.getUserId(httpSession)
                                            nickname = sessionUtil.getUserNickname(httpSession)
                                        }
                                    }
                                    if (userId != null) {
                                        accessor.sessionAttributes = accessor.sessionAttributes ?: mutableMapOf()
                                        accessor.sessionAttributes!!["userId"] = userId
                                        nickname?.let { accessor.sessionAttributes!!["nickname"] = it }
                                        log.info("[CONNECTION] WebSocket connected: sessionId={}, userId={}, nickname={}", sessionId, userId, nickname)
                                        sessionId?.let { wsSessionId -> webSocketSessionManager.storeSession(wsSessionId, httpSession) }
                                        sessionId?.let { wsSessionId -> connectionManager.registerConnection(wsSessionId, userId) }
                                    } else {
                                        log.warn("[SECURITY] Rejecting CONNECT (no userId) sessionId={}", sessionId)
                                        throw RuntimeException("UNAUTHENTICATED_CONNECT")
                                    }
                                } else {
                                    log.warn("[SECURITY] Rejecting CONNECT (no HTTP session) sessionId={}", sessionId)
                                    throw RuntimeException("NO_HTTP_SESSION")
                                }
                            } catch (e: Exception) {
                                if (e.message != "UNAUTHENTICATED_CONNECT" && e.message != "NO_HTTP_SESSION") {
                                    log.error("Failed during CONNECT: {}", e.message)
                                }
                                throw e
                            }
                        }
                        StompCommand.SEND -> {
                            val sessionId = accessor.sessionId
                            if (sessionId != null) {
                                val clientId = getWebSocketClientId(accessor)
                                if (rateLimitEnabled && !rateLimitingService.isWebSocketMessageAllowed(clientId)) {
                                    log.warn("[SECURITY] WebSocket rate limit exceeded for client: {}", clientId)
                                    return null
                                }
                                val httpSession = accessor.sessionAttributes?.get("HTTP.SESSION") as? jakarta.servlet.http.HttpSession
                                webSocketSessionManager.ensureSessionInitialized(sessionId, httpSession)
                                webSocketSessionManager.injectUserInfo(accessor)
                                val userId = accessor.sessionAttributes?.get("userId") as? Long
                                if (userId == null) {
                                    if (accessor.sessionAttributes?.get("_authWarned") != true) {
                                        accessor.sessionAttributes?.put("_authWarned", true)
                                        log.warn("[SECURITY] Blocked SEND without userId sessionId={}", sessionId)
                                    }
                                    return null
                                }
                            }
                        }
                        StompCommand.DISCONNECT -> {
                            val sessionId = accessor.sessionId
                            if (sessionId != null) {
                                webSocketSessionManager.removeSession(sessionId)
                                connectionManager.handleDisconnection(sessionId)
                                log.info("[CONNECTION] WebSocket disconnected: {}", sessionId)
                            }
                        }
                        else -> {}
                    }
                    return message
                }
            }
        )
    }

    private fun getWebSocketClientId(accessor: StompHeaderAccessor): String {
        val sessionAttributes = accessor.sessionAttributes
        val userId = sessionAttributes?.get("userId") as? Long
        if (userId != null) return "user:$userId"
        val sessionId = accessor.sessionId
        if (sessionId != null) return "ws:$sessionId"
        return "unknown:${System.currentTimeMillis()}"
    }
}