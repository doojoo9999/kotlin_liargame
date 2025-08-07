package org.example.kotlin_liargame.tools.websocket

import org.springframework.context.annotation.Configuration
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
    private val webSocketSessionManager: WebSocketSessionManager
) : WebSocketMessageBrokerConfigurer {
    
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        config.enableSimpleBroker("/topic")
        config.setApplicationDestinationPrefixes("/app")
    }
    
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
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
                            println("[DEBUG] HTTP session added to WebSocket attributes: ${httpSession.id}")
                            
                            try {
                                httpSession.attributeNames.asIterator().forEach { attrName ->
                                    println("[DEBUG] HTTP Session attribute: $attrName = ${httpSession.getAttribute(attrName)}")
                                }
                            } catch (e: Exception) {
                                println("[WARN] Error reading HTTP session attributes: ${e.message}")
                            }
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
                    } else {
                        println("[DEBUG] WebSocket handshake completed successfully")
                    }
                }
            })
            .withSockJS()
    }
    
    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(object : ChannelInterceptor {
            override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
                val accessor = StompHeaderAccessor.wrap(message)
                
                when (accessor.command) {
                    StompCommand.CONNECT -> {
                        val sessionId = accessor.sessionId
                        println("[DEBUG] WebSocket connection attempt: $sessionId")

                        try {
                            val httpSession = accessor.sessionAttributes?.get("HTTP.SESSION") as? jakarta.servlet.http.HttpSession
                            println("[DEBUG] HTTP Session found: ${httpSession != null}")

                            if (httpSession != null) {
                                println("[DEBUG] HTTP Session details: ${httpSession.id}")
                                try {
                                    httpSession.attributeNames.asIterator().forEach { attrName ->
                                        println("[DEBUG]   - $attrName: ${httpSession.getAttribute(attrName)}")
                                    }
                                } catch (e: Exception) {
                                    println("[WARN] Error reading session attributes: ${e.message}")
                                }

                                sessionId?.let { wsSessionId ->
                                    webSocketSessionManager.storeSession(wsSessionId, httpSession)
                                }

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

                                try {
                                    val headers = message.headers
                                    println("[DEBUG] All headers:")
                                    headers.forEach { (key, value) ->
                                        println("[DEBUG]   - $key: $value")
                                    }

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

                    StompCommand.SEND -> {
                        val sessionId = accessor.sessionId
                        if (sessionId != null) {
                            webSocketSessionManager.injectUserInfo(accessor)

                            println("[DEBUG] WebSocket message from sessionId: $sessionId")
                            println("[DEBUG] SessionAttributes after injection: ${accessor.sessionAttributes?.keys}")
                        }
                    }

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