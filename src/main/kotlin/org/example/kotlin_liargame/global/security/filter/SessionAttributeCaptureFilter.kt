package org.example.kotlin_liargame.global.security.filter

import jakarta.servlet.*
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpSession
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

@Component
@Order(5) // 보안/로그 필터보다 뒤에서 실행되도록 적절히 조정 가능
class SessionAttributeCaptureFilter : Filter {
    override fun doFilter(request: ServletRequest, response: ServletResponse, chain: FilterChain) {
        if (request is HttpServletRequest) {
            try {
                val session: HttpSession = request.getSession(false) ?: request.getSession(true)
                val ip = extractClientIp(request)
                if (session.getAttribute("CLIENT_IP") == null && ip.isNotBlank()) {
                    session.setAttribute("CLIENT_IP", ip)
                }
                val ua = request.getHeader("User-Agent") ?: ""
                if (session.getAttribute("USER_AGENT") == null && ua.isNotBlank()) {
                    session.setAttribute("USER_AGENT", ua.take(300)) // 과도한 길이 방지
                }
            } catch (_: IllegalStateException) {
            } catch (e: Exception) {

            }
        }
        chain.doFilter(request, response)
    }

    private fun extractClientIp(request: HttpServletRequest): String {
        val headerCandidates = listOf(
            "X-Forwarded-For", "X-Real-IP", "CF-Connecting-IP", "X-Client-IP", "X-Forwarded", "Forwarded-For", "Forwarded"
        )
        for (header in headerCandidates) {
            val value = request.getHeader(header)
            if (!value.isNullOrBlank() && value.lowercase() != "unknown") {
                return value.split(',')[0].trim()
            }
        }
        return request.remoteAddr ?: ""
    }

    override fun init(filterConfig: FilterConfig?) {}
    override fun destroy() {}
}
