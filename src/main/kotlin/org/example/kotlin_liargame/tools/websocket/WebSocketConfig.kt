package org.example.kotlin_liargame.tools.websocket

import org.springframework.context.annotation.Configuration
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val webSocketSessionManager: WebSocketSessionManager
) : WebSocketMessageBrokerConfigurer {
    
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        config.enableSimpleBroker("/topic")
        config.setApplicationDestinationPrefixes("/app")
    }
    
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .withSockJS()
    }
    
    // 세션 기반 인증을 위한 인터셉터
    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(object : ChannelInterceptor {
            override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
                val accessor = StompHeaderAccessor.wrap(message)
                
                when (accessor.command) {
                    // 연결 시 HTTP 세션 정보 저장
                    StompCommand.CONNECT -> {
                        val sessionId = accessor.sessionId
                        println("[DEBUG] WebSocket connection attempt: $sessionId")

                        try {
                            val httpSession = accessor.sessionAttributes?.get("HTTP.SESSION") as? jakarta.servlet.http.HttpSession
                            println("[DEBUG] HTTP Session found: ${httpSession != null}")

                            if (httpSession != null) {
                                // 세션에서 모든 속성 출력
                                println("[DEBUG] HTTP Session details: ${httpSession.id}")
                                try {
                                    httpSession.attributeNames.asIterator().forEach { attrName ->
                                        println("[DEBUG]   - $attrName: ${httpSession.getAttribute(attrName)}")
                                    }
                                } catch (e: Exception) {
                                    println("[WARN] Error reading session attributes: ${e.message}")
                                }

                                // WebSocket 세션 매니저에 세션 정보 저장
                                sessionId?.let { wsSessionId ->
                                    webSocketSessionManager.storeSession(wsSessionId, httpSession)
                                }

                                // 기존 로직도 유지
                                val userId = httpSession.getAttribute("userId") as? Long
                                val nickname = httpSession.getAttribute("nickname") as? String

                                println("[DEBUG] Session values - userId: $userId, nickname: $nickname")

                                if (userId != null) {
                                    accessor.sessionAttributes = accessor.sessionAttributes ?: mutableMapOf()
                                    accessor.sessionAttributes!!["userId"] = userId

                                    if (nickname != null) {
                                        accessor.sessionAttributes!!["nickname"] = nickname
                                    }

                                    println("[DEBUG] WebSocket session authenticated with userId: $userId, nickname: $nickname")
                                }
                            } else {
                                println("[WARN] No HTTP session found in WebSocket connection")

                                // 디버깅을 위한 모든 헤더 출력
                                try {
                                    val headers = message.headers
                                    println("[DEBUG] All headers:")
                                    headers.forEach { (key, value) ->
                                        println("[DEBUG]   - $key: $value")
                                    }

                                    // 디버깅: 세션 속성이 있으면 모두 출력
                                    if (accessor.sessionAttributes != null) {
                                        println("[DEBUG] Session attributes:")
                                        accessor.sessionAttributes!!.forEach { (key, value) ->
                                            println("[DEBUG]   - $key: $value")
                                        }
                                    } else {
                                        println("[DEBUG] No session attributes available")
                                    }
                                } catch (e: Exception) {
                                    println("[DEBUG] Failed to read headers: ${e.message}")
                                }
                            }
                        } catch (e: Exception) {
                            println("[ERROR] Failed to extract userId from HTTP session: ${e.message}")
                            e.printStackTrace()
                        }
                    }

                    // 메시지 전송 시 세션 정보 활용
                    StompCommand.SEND -> {
                        val sessionId = accessor.sessionId
                        if (sessionId != null) {
                            // 세션 매니저에서 저장된 사용자 정보 주입
                            webSocketSessionManager.injectUserInfo(accessor)

                            // 디버깅 로그
                            println("[DEBUG] WebSocket message from sessionId: $sessionId")
                            println("[DEBUG] SessionAttributes after injection: ${accessor.sessionAttributes?.keys}")
                        }
                    }

                    // 연결 해제 시 세션 정보 제거
                    StompCommand.DISCONNECT -> {
                        val sessionId = accessor.sessionId
                        if (sessionId != null) {
                            webSocketSessionManager.removeSession(sessionId)
                            println("[DEBUG] WebSocket session disconnected: $sessionId")
                        }
                    }

                    else -> {}
                }
                
                return message
            }
        })
    }
}