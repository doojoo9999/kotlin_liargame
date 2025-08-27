package org.example.kotlin_liargame.global.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

@Component
class RateLimitingInterceptor(
    private val rateLimitingService: RateLimitingService
) : HandlerInterceptor {
    
    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        val requestURI = request.requestURI
        if (shouldSkipRateLimit(requestURI)) {
            return true
        }
        
        val clientId = getClientIdentifier(request)
        
        if (!rateLimitingService.isApiRequestAllowed(clientId)) {
            handleRateLimitExceeded(response, clientId)
            return false
        }
        
        addRateLimitHeaders(response, clientId)
        
        return true
    }

    private fun shouldSkipRateLimit(requestURI: String): Boolean {
        val skipPaths = listOf(
            // Health check endpoints
            "/actuator/health",
            "/actuator/info",
            "/actuator/metrics",
            "/actuator/prometheus",
            "/api/v1/admin/health",
            "/h2-console",

            // WebSocket related endpoints
            "/ws",
            "/ws/info",
            "/sockjs",

            // Frequently called authentication endpoints that should not be rate limited
            "/api/v1/auth/me",

            // Game state queries - these are called frequently during gameplay
            "/api/v1/game/",

            // Static resources
            "/favicon.ico",
            "/static",
            "/assets"
        )
        
        return skipPaths.any { requestURI.startsWith(it) }
    }
    

    private fun getClientIdentifier(request: HttpServletRequest): String {
        val session = request.getSession(false)
        if (session != null) {
            val userId = session.getAttribute("userId")
            if (userId != null) {
                return "user:$userId"
            }
            return "session:${session.id}"
        }
        
        val clientIp = getClientIpAddress(request)
        return "ip:$clientIp"
    }

    private fun getClientIpAddress(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            return xForwardedFor.split(",")[0].trim()
        }
        
        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp
        }
        
        return request.remoteAddr ?: "unknown"
    }

    private fun handleRateLimitExceeded(response: HttpServletResponse, clientId: String) {
        response.status = HttpStatus.TOO_MANY_REQUESTS.value()
        response.contentType = "application/json;charset=UTF-8"
        
        val status = rateLimitingService.getClientRequestStatus(clientId)
        val errorResponse = """
            {
                "error": "Rate limit exceeded",
                "message": "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
                "code": "RATE_LIMIT_EXCEEDED",
                "details": {
                    "requestsInLastMinute": ${status.apiRequestsInLastMinute},
                    "requestsPerMinuteLimit": ${status.apiRequestsPerMinuteLimit},
                    "retryAfter": 60
                }
            }
        """.trimIndent()
        
        response.writer.write(errorResponse)
        response.addHeader("Retry-After", "60")

        println("[SECURITY] Rate limit exceeded for client: $clientId, requests: ${status.apiRequestsInLastMinute}/${status.apiRequestsPerMinuteLimit}")
    }

    private fun addRateLimitHeaders(response: HttpServletResponse, clientId: String) {
        val status = rateLimitingService.getClientRequestStatus(clientId)
        
        response.addHeader("X-RateLimit-Limit", status.apiRequestsPerMinuteLimit.toString())
        response.addHeader("X-RateLimit-Remaining", 
            (status.apiRequestsPerMinuteLimit - status.apiRequestsInLastMinute).toString())
        response.addHeader("X-RateLimit-Reset", "60") // 60초 후 리셋
    }
}