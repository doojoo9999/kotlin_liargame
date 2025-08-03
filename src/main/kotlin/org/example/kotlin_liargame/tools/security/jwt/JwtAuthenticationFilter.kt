package org.example.kotlin_liargame.tools.security.jwt

import io.jsonwebtoken.ExpiredJwtException
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.example.kotlin_liargame.domain.user.repository.UserTokenRepository
import org.example.kotlin_liargame.tools.security.UserPrincipal
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val jwtProvider: JwtProvider,
    private val userTokenRepository: UserTokenRepository,
    private val jwtProperties: JwtProperties
) : OncePerRequestFilter() {

    private val jwtLogger = LoggerFactory.getLogger(this::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {

        if (jwtProperties.isTestUser) {
            val userPrincipal = UserPrincipal(
                userId = 1L,
                nickname = "TestUser",
                authorities = emptyList(),
                providerId = "test"
            )
            val authentication = UsernamePasswordAuthenticationToken(
                userPrincipal,
                "",
                emptyList()
            )

            SecurityContextHolder.getContext().authentication = authentication
        } else {

            val token = resolveToken(request)
            jwtLogger.debug("JWT Token Check: ${if (token != null) "Token exists" else "Token missing"}")

            if (token != null) {
                try {
                    if (jwtProvider.validateToken(token)) {
                        val claims = jwtProvider.getClaimsSafely(token)
                        if (claims != null) {
                            val userId = claims.subject.toLong()
                            val nickname = claims.get("nickname", String::class.java)

                            // 관리자 토큰 처리 (-1 subject는 관리자)
                            val actualUserId = if (userId == -1L) 999999991L else userId
                            val actualNickname = if (nickname == "admin") "Admin" else nickname

                            val userPrincipal = org.example.kotlin_liargame.tools.security.UserPrincipal(
                                userId = userId,
                                nickname = nickname,
                                authorities = emptyList(),
                                providerId = "jwt"
                            )
                            val authentication = UsernamePasswordAuthenticationToken(userPrincipal, "", emptyList())
                            SecurityContextHolder.getContext().authentication = authentication
                            jwtLogger.debug("JWT Authentication Success: userId=${userId}, nickname=${nickname}")

                            if (!jwtProvider.isTokenInDatabase(token)) {
                                jwtLogger.warn("JWT Token not found in database or expired: userId=${userId}, nickname=${nickname}")
                            }
                        } else {
                            jwtLogger.warn("Cannot extract claims from token")
                            SecurityContextHolder.clearContext()
                        }
                    } else {
                        jwtLogger.debug("Invalid or expired JWT Token")
                        SecurityContextHolder.clearContext()
                    }
                } catch (e: ExpiredJwtException) {
                    jwtLogger.debug("JWT Token expired: ${e.message}")
                    SecurityContextHolder.clearContext()
                } catch (e: Exception) {
                    jwtLogger.error("JWT Authentication Error: ${e.message}")
                    SecurityContextHolder.clearContext()
                }
            }
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
