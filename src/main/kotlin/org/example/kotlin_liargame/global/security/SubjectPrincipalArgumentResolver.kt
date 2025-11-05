package org.example.kotlin_liargame.global.security

import jakarta.servlet.http.HttpServletRequest
import org.springframework.core.MethodParameter
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer
import org.springframework.web.server.ResponseStatusException

@Component
class SubjectPrincipalArgumentResolver(
    private val subjectPrincipalResolver: SubjectPrincipalResolver
) : HandlerMethodArgumentResolver {

    override fun supportsParameter(parameter: MethodParameter): Boolean {
        return parameter.hasParameterAnnotation(RequireSubject::class.java) &&
            SubjectPrincipal::class.java.isAssignableFrom(parameter.parameterType)
    }

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?
    ): Any {
        val httpRequest = webRequest.getNativeRequest(HttpServletRequest::class.java)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing HTTP request context")
        val principal = subjectPrincipalResolver.getCurrentPrincipal(httpRequest)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "SUBJECT_REQUIRED")
        return principal
    }
}

