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
        // 관리자 엔드포인트나 헬스체크는 제외
        val requestURI = request.requestURI
        if (shouldSkipRateLimit(requestURI)) {
            return true
        }

        val clientId = getClientIdentifier(request)

        if (!rateLimitingService.isApiRequestAllowed(clientId)) {
            handleRateLimitExceeded(response, clientId)
            return false
        }

        // Rate limit 헤더 추가
        addRateLimitHeaders(response, clientId)

        return true
    }

    /**
     * Rate limiting을 건너뛸 엔드포인트 확인
     */
    private fun shouldSkipRateLimit(requestURI: String): Boolean {
        val skipPaths = listOf(
            "/actuator/health",
            "/actuator/info",
            "/actuator/metrics",
            "/actuator/prometheus",
            "/api/v1/admin/health",
            "/h2-console"
        )

        return skipPaths.any { requestURI.startsWith(it) }
    }

    /**
     * 클라이언트 식별자 생성 (세션 ID 우선, 없으면 IP 주소)
     */
    private fun getClientIdentifier(request: HttpServletRequest): String {
        // 1. 세션 ID 사용 (로그인한 사용자)
        val session = request.getSession(false)
        if (session != null) {
            val userId = session.getAttribute("userId")
            if (userId != null) {
                return "user:$userId"
            }
            return "session:${session.id}"
        }

        // 2. IP 주소 사용 (익명 사용자)
        val clientIp = getClientIpAddress(request)
        return "ip:$clientIp"
    }

    /**
     * 클라이언트 IP 주소 추출 (프록시 고려)
     */
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

    /**
     * Rate limit 초과 시 응답 처리
     */
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

        // 로깅
        println("[SECURITY] Rate limit exceeded for client: $clientId, requests: ${status.apiRequestsInLastMinute}/${status.apiRequestsPerMinuteLimit}")
    }

    /**
     * Rate limit 관련 헤더 추가
     */
    private fun addRateLimitHeaders(response: HttpServletResponse, clientId: String) {
        val status = rateLimitingService.getClientRequestStatus(clientId)

        response.addHeader("X-RateLimit-Limit", status.apiRequestsPerMinuteLimit.toString())
        response.addHeader("X-RateLimit-Remaining",
            (status.apiRequestsPerMinuteLimit - status.apiRequestsInLastMinute).toString())
        response.addHeader("X-RateLimit-Reset", "60") // 60초 후 리셋
    }
}