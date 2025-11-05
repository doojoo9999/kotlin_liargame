package org.example.kotlin_liargame.global.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class RateLimitingFilter(
    private val rateLimitingService: RateLimitingService
) : OncePerRequestFilter() {

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val uri = request.requestURI ?: return true
        if (uri.contains("/ws", ignoreCase = true) || uri.contains("/sockjs", ignoreCase = true)) {
            return true
        }
        return SKIP_PATHS.any { uri.startsWith(it) }
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val subject = request.getAttribute(SubjectPrincipalResolver.REQUEST_ATTRIBUTE) as? SubjectPrincipal
        val clientId = subject?.let { "subject:${it.subjectKey}" } ?: "ip:${resolveClientIp(request)}"

        if (!rateLimitingService.isApiRequestAllowed(clientId)) {
            val status = rateLimitingService.getClientRequestStatus(clientId)
            response.status = HttpStatus.TOO_MANY_REQUESTS.value()
            response.contentType = "application/json;charset=UTF-8"
            response.addHeader("Retry-After", "60")
            response.writer.write(
                """
                {
                    "error":"Rate limit exceeded",
                    "code":"RATE_LIMIT_EXCEEDED",
                    "details":{
                        "requestsInLastMinute":${status.apiRequestsInLastMinute},
                        "requestsPerMinuteLimit":${status.apiRequestsPerMinuteLimit},
                        "retryAfter":60
                    }
                }
                """.trimIndent()
            )
            return
        }

        filterChain.doFilter(request, response)
    }

    private fun resolveClientIp(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrBlank()) {
            return xForwardedFor.split(",").first().trim()
        }
        val xRealIp = request.getHeader("X-Real-IP")
        if (!xRealIp.isNullOrBlank()) {
            return xRealIp
        }
        return request.remoteAddr ?: "unknown"
    }

    companion object {
        private val SKIP_PATHS = listOf(
            "/actuator",
            "/h2-console",
            "/api/auth",
            "/favicon.ico",
            "/static",
            "/assets"
        )
    }
}

