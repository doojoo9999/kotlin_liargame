package org.example.kotlin_liargame.global.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

class SubjectPrincipalFilter(
    private val subjectPrincipalResolver: SubjectPrincipalResolver
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val principal = subjectPrincipalResolver.resolveOrCreate(request, response)
        val currentAuth = SecurityContextHolder.getContext().authentication
        if (currentAuth !is SubjectAuthentication || currentAuth.principal != principal) {
            SecurityContextHolder.getContext().authentication = SubjectAuthentication(principal)
        }
        filterChain.doFilter(request, response)
    }
}

