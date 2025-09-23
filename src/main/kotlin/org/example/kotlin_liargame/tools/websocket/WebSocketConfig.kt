package org.example.kotlin_liargame.tools.websocket

import org.example.kotlin_liargame.global.security.RateLimitingService
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.example.kotlin_liargame.tools.websocket.model.StompPrincipal
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
import org.springframework.web.socket.server.support.DefaultHandshakeHandler

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val webSocketSessionManager: WebSocketSessionManager,
    private val rateLimitingService: RateLimitingService,
    @Lazy private val connectionManager: WebSocketConnectionManager,
    @Lazy private val webSocketActivityInterceptor: WebSocketActivityInterceptor,
    private val sessionUtil: org.example.kotlin_liargame.global.util.SessionUtil,
    private val sessionManagementService: SessionManagementService,
    @Value("\${ratelimit.enabled:true}") private val rateLimitEnabled: Boolean
) : WebSocketMessageBrokerConfigurer {
    private val logger = LoggerFactory.getLogger(WebSocketConfig::class.java)
    
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        config.enableSimpleBroker("/topic", "/queue")
        config.setApplicationDestinationPrefixes("/app")
        config.setUserDestinationPrefix("/user")
    }
    
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(*getAllowedOriginPatterns())
            .setHandshakeHandler(object : DefaultHandshakeHandler() {
                override fun determineUser(
                    request: ServerHttpRequest,
                    wsHandler: WebSocketHandler,
                    attributes: MutableMap<String, Any>
                ): java.security.Principal? {
                    val servletRequest = (request as? ServletServerHttpRequest)?.servletRequest
                    val httpSession = servletRequest?.getSession(false)
                    val sessionId = httpSession?.id ?: servletRequest?.requestedSessionId

                    var userId = httpSession?.let { sessionUtil.getUserId(it) }
                    var nickname = httpSession?.let { sessionUtil.getUserNickname(it) }

                    if (userId == null && httpSession != null && sessionId != null) {
                        sessionManagementService.getSessionInfoById(sessionId)?.let { info ->
                            if (sessionManagementService.rehydrateSession(httpSession, info)) {
                                userId = info.userId
                                nickname = info.nickname
                            }
                        }
                    }

                    return if (userId != null) {
                        val principal = StompPrincipal(
                            userId = userId!!,
                            sessionId = httpSession?.id ?: sessionId ?: "",
                            nickname = nickname
                        )
                        attributes["PRINCIPAL"] = principal
                        principal
                    } else {
                        logger.warn("Rejecting WebSocket handshake without authenticated session (sessionId={})", sessionId)
                        null
                    }
                }
            })
            .addInterceptors(object : HandshakeInterceptor {
                override fun beforeHandshake(
                    request: ServerHttpRequest,
                    response: ServerHttpResponse,
                    wsHandler: WebSocketHandler,
                    attributes: MutableMap<String, Any>
                ): Boolean {
                    if (request is ServletServerHttpRequest) {
                        val httpSession = request.servletRequest.getSession(false)
                        if (httpSession != null) {
                            attributes["HTTP.SESSION"] = httpSession
                            attributes["HTTP.SESSION.ID"] = httpSession.id
                        } else {
                            val requestedId = request.servletRequest.requestedSessionId
                            if (!requestedId.isNullOrBlank()) {
                                attributes["HTTP.SESSION.ID"] = requestedId
                            }
                            logger.warn("No HTTP session found during WebSocket handshake (requestedSessionId={})", requestedId)
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
                        logger.error("WebSocket handshake failed: {}", exception.message)
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
                "http://localhost:3000",
                "http://localhost:5173"
            )
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
            webSocketActivityInterceptor, // 활동 감지 인터셉터 추가
            object : ChannelInterceptor {
                override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
                    val accessor = StompHeaderAccessor.wrap(message)

                    when (accessor.command) {
                        StompCommand.CONNECT -> {
                            val sessionId = accessor.sessionId

                            try {
                                val httpSession = accessor.sessionAttributes?.get("HTTP.SESSION") as? jakarta.servlet.http.HttpSession
                                val httpSessionId = httpSession?.id ?: accessor.sessionAttributes?.get("HTTP.SESSION.ID") as? String

                                if (httpSession != null) {
                                    var userId = sessionUtil.getUserId(httpSession)
                                    var nickname = sessionUtil.getUserNickname(httpSession)
                                    if (userId == null || nickname == null) {
                                        logger.warn("Initial session data not found during WebSocket connect, attempting retry...")
                                        Thread.sleep(50)
                                        userId = sessionUtil.getUserId(httpSession)
                                        nickname = sessionUtil.getUserNickname(httpSession)
                                        if (userId == null || nickname == null) {
                                            Thread.sleep(100)
                                            userId = sessionUtil.getUserId(httpSession)
                                            nickname = sessionUtil.getUserNickname(httpSession)
                                        }
                                    }

                                    if (userId == null && httpSessionId != null) {
                                        sessionManagementService.getSessionInfoById(httpSessionId)?.let { info ->
                                            if (sessionManagementService.rehydrateSession(httpSession, info)) {
                                                userId = info.userId
                                                nickname = info.nickname
                                            }
                                        }
                                    }

                                    if (userId != null) {
                                        accessor.sessionAttributes = accessor.sessionAttributes ?: mutableMapOf()
                                        accessor.sessionAttributes!!["userId"] = userId
                                        if (nickname != null) accessor.sessionAttributes!!["nickname"] = nickname

                                        if (accessor.user == null && sessionId != null) {
                                            accessor.user = StompPrincipal(userId, sessionId, nickname)
                                        }

                                        logger.info("[CONNECTION] WebSocket connected: sessionId={}, userId={}, nickname={}", sessionId, userId, nickname)

                                        sessionId?.let { wsSessionId ->
                                            webSocketSessionManager.storeSession(wsSessionId, httpSession)
                                        }

                                        val oldSessionId = accessor.getFirstNativeHeader("x-old-session-id")
                                        var reconnected = false
                                        if (!oldSessionId.isNullOrBlank() && sessionId != null && oldSessionId != sessionId) {
                                            try {
                                                reconnected = connectionManager.handleReconnection(oldSessionId, sessionId, userId)
                                                if (reconnected) {
                                                    logger.info("[CONNECTION] Standardized reconnection via header: {} -> {} (userId={})", oldSessionId, sessionId, userId)
                                                }
                                            } catch (e: Exception) {
                                                logger.error("[ERROR] Standardized reconnection failed: {}", e.message)
                                            }
                                        }

                                        if (!reconnected) {
                                            sessionId?.let { wsSessionId ->
                                                connectionManager.registerConnection(wsSessionId, userId)
                                            }
                                        }
                                    } else {
                                        logger.warn("No userId found in HTTP session after retries (httpSessionId={})", httpSessionId)
                                    }
                                } else {
                                    logger.warn("No HTTP session found in WebSocket connection (sessionAttributesId={})", httpSessionId)
                                }
                            } catch (e: Exception) {
                                logger.error("[ERROR] Failed to extract userId from HTTP session: {}", e.message)
                            }
                        }


                        StompCommand.SEND -> {
                            val sessionId = accessor.sessionId
                            if (sessionId != null) {
                                // Rate limiting 검사
                                val clientId = getWebSocketClientId(accessor)
                                if (rateLimitEnabled && !rateLimitingService.isWebSocketMessageAllowed(clientId)) {
                                    logger.warn("[SECURITY] WebSocket rate limit exceeded for client: {}", clientId)
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
                                logger.info("[CONNECTION] WebSocket disconnected: {}", sessionId)
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
        
        accessor.user?.name?.let { return "principal:$it" }

        // 2. WebSocket 세션 ID 사용
        val sessionId = accessor.sessionId
        if (sessionId != null) {
            return "ws:$sessionId"
        }

        // 3. 기본값
        return "unknown:${System.currentTimeMillis()}"
    }
}
