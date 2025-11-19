package org.example.kotlin_liargame.global.security

import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit
import java.util.concurrent.ConcurrentHashMap

@Service
class RateLimitingService(
    private val rateLimitProperties: RateLimitProperties
) {
    
    private val apiRequestCounts = ConcurrentHashMap<String, MutableList<LocalDateTime>>()
    private val websocketMessageCounts = ConcurrentHashMap<String, MutableList<LocalDateTime>>()
    private val websocketHandshakeCounts = ConcurrentHashMap<String, MutableList<LocalDateTime>>()

    fun isEnabled(): Boolean = rateLimitProperties.enabled
    
    /**
     * API 요청에 대한 Rate Limiting 검사
     */
    fun isApiRequestAllowed(clientId: String): Boolean {
        if (!isEnabled()) {
            return true
        }
        return isRequestAllowed(
            clientId = clientId,
            requestCounts = apiRequestCounts,
            requestsPerMinute = rateLimitProperties.api.requestsPerMinute,
            burstCapacity = rateLimitProperties.api.burstCapacity
        )
    }
    
    /**
     * WebSocket 메시지에 대한 Rate Limiting 검사
     */
    fun isWebSocketMessageAllowed(clientId: String): Boolean {
        if (!isEnabled()) {
            return true
        }
        return isRequestAllowed(
            clientId = clientId,
            requestCounts = websocketMessageCounts,
            requestsPerMinute = rateLimitProperties.websocket.messagesPerMinute,
            burstCapacity = rateLimitProperties.websocket.burstCapacity
        )
    }

    /**
     * WebSocket 핸드셰이크에 대한 Rate Limiting 검사
     */
    fun isWebSocketHandshakeAllowed(clientId: String): Boolean {
        if (!isEnabled()) {
            return true
        }
        return isRequestAllowed(
            clientId = clientId,
            requestCounts = websocketHandshakeCounts,
            requestsPerMinute = rateLimitProperties.websocket.handshakesPerMinute,
            burstCapacity = rateLimitProperties.websocket.handshakeBurstCapacity
        )
    }
    
    /**
     * 공통 Rate Limiting 로직
     */
    private fun isRequestAllowed(
        clientId: String,
        requestCounts: ConcurrentHashMap<String, MutableList<LocalDateTime>>,
        requestsPerMinute: Int,
        burstCapacity: Int
    ): Boolean {
        val now = LocalDateTime.now()
        val requests = requestCounts.computeIfAbsent(clientId) { mutableListOf() }
        
        synchronized(requests) {
            // 1분 이전의 요청들 제거
            requests.removeIf { request ->
                ChronoUnit.SECONDS.between(request, now) > 60
            }
            
            // Burst capacity 검사 (즉시 처리 가능한 최대 요청 수)
            if (requests.size >= burstCapacity) {
                return false
            }
            
            // 분당 요청 수 검사
            val requestsInLastMinute = requests.count { request ->
                ChronoUnit.SECONDS.between(request, now) <= 60
            }
            
            if (requestsInLastMinute >= requestsPerMinute) {
                return false
            }
            
            // 요청 허용 - 현재 시간 기록
            requests.add(now)
            return true
        }
    }
    
    /**
     * 특정 클라이언트의 요청 기록 초기화
     */
    fun resetClientRequests(clientId: String) {
        apiRequestCounts.remove(clientId)
        websocketMessageCounts.remove(clientId)
        websocketHandshakeCounts.remove(clientId)
    }
    
    /**
     * 모든 만료된 요청 기록 정리 (메모리 관리)
     */
    fun cleanupExpiredRequests() {
        val now = LocalDateTime.now()
        
        cleanupRequestMap(apiRequestCounts, now)
        cleanupRequestMap(websocketMessageCounts, now)
        cleanupRequestMap(websocketHandshakeCounts, now)
    }
    
    private fun cleanupRequestMap(
        requestMap: ConcurrentHashMap<String, MutableList<LocalDateTime>>,
        now: LocalDateTime
    ) {
        val keysToRemove = mutableListOf<String>()
        
        requestMap.forEach { (clientId, requests) ->
            synchronized(requests) {
                requests.removeIf { request ->
                    ChronoUnit.SECONDS.between(request, now) > 300 // 5분 이전 기록 제거
                }
                
                if (requests.isEmpty()) {
                    keysToRemove.add(clientId)
                }
            }
        }
        
        keysToRemove.forEach { key ->
            requestMap.remove(key)
        }
    }
    
    /**
     * 클라이언트의 현재 요청 상태 조회
     */
    fun getClientRequestStatus(clientId: String): RateLimitStatus {
        val now = LocalDateTime.now()
        
        val apiRequests = apiRequestCounts[clientId]?.let { requests ->
            synchronized(requests) {
                requests.count { request ->
                    ChronoUnit.SECONDS.between(request, now) <= 60
                }
            }
        } ?: 0
        
        val websocketMessages = websocketMessageCounts[clientId]?.let { requests ->
            synchronized(requests) {
                requests.count { request ->
                    ChronoUnit.SECONDS.between(request, now) <= 60
                }
            }
        } ?: 0

        val websocketHandshakes = websocketHandshakeCounts[clientId]?.let { requests ->
            synchronized(requests) {
                requests.count { request ->
                    ChronoUnit.SECONDS.between(request, now) <= 60
                }
            }
        } ?: 0

        return RateLimitStatus(
            clientId = clientId,
            apiRequestsInLastMinute = apiRequests,
            apiRequestsPerMinuteLimit = rateLimitProperties.api.requestsPerMinute,
            websocketMessagesInLastMinute = websocketMessages,
            websocketMessagesPerMinuteLimit = rateLimitProperties.websocket.messagesPerMinute,
            websocketHandshakesInLastMinute = websocketHandshakes,
            websocketHandshakesPerMinuteLimit = rateLimitProperties.websocket.handshakesPerMinute,
            isApiLimited = apiRequests >= rateLimitProperties.api.requestsPerMinute,
            isWebSocketLimited = websocketMessages >= rateLimitProperties.websocket.messagesPerMinute,
            isHandshakeLimited = websocketHandshakes >= rateLimitProperties.websocket.handshakesPerMinute
        )
    }
}

data class RateLimitStatus(
    val clientId: String,
    val apiRequestsInLastMinute: Int,
    val apiRequestsPerMinuteLimit: Int,
    val websocketMessagesInLastMinute: Int,
    val websocketMessagesPerMinuteLimit: Int,
    val websocketHandshakesInLastMinute: Int,
    val websocketHandshakesPerMinuteLimit: Int,
    val isApiLimited: Boolean,
    val isWebSocketLimited: Boolean,
    val isHandshakeLimited: Boolean
)
