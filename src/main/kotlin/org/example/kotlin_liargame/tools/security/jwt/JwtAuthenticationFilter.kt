package org.example.kotlin_liargame.tools.security.jwt

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val jwtProvider: JwtProvider
) : OncePerRequestFilter() {

    private val logger = LoggerFactory.getLogger(this::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val token = resolveToken(request)
        logger.debug("JWT ��ū Ȯ��: {}", if (token != null) "��ū ����" else "��ū ����")


        if (token != null && jwtProvider.validateToken(token)) {
            val claims = jwtProvider.getClaims(token)
            val authentication = UsernamePasswordAuthenticationToken(claims.subject, "", listOf())
            SecurityContextHolder.getContext().authentication = authentication
            logger.debug("JWT ���� ����: subject={}", claims.subject)

        }

        filterChain.doFilter(request, response)
    }

     fun resolveToken(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7)
        }
        return null
    }
}