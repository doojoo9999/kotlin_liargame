package org.example.lineagew.common.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.method.HandlerMethod
import org.springframework.web.server.ResponseStatusException
import org.springframework.web.servlet.HandlerInterceptor

@Component
class LineagewAdminInterceptor(
    private val adminProperties: LineagewAdminProperties
) : HandlerInterceptor {

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        val handlerMethod = handler as? HandlerMethod ?: return true

        val requiresAdmin = handlerMethod.hasMethodAnnotation(LineagewAdminOnly::class.java) ||
            handlerMethod.beanType.isAnnotationPresent(LineagewAdminOnly::class.java)

        if (!requiresAdmin) {
            return true
        }

        if (!adminProperties.isConfigured()) {
            throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "관리자 키가 설정되지 않았습니다.")
        }

        val headerName = adminProperties.resolvedHeaderName()
        val providedKey = request.getHeader(headerName)

        if (providedKey.isNullOrBlank() || providedKey != adminProperties.key) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.")
        }

        return true
    }
}
