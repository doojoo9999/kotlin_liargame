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
        val requestURI = request.requestURI
        val method = request.method
        
        // Enhanced logging for debugging
        jwtLogger.info("[JWT_FILTER] Processing request: $method $requestURI")
        
        // Log all Authorization headers for debugging
        val authHeader = request.getHeader("Authorization")
        jwtLogger.info("[JWT_FILTER] Authorization header: ${if (authHeader != null) "Present (${authHeader.take(20)}...)" else "Missing"}")

        if (jwtProperties.isTestUser) {
            jwtLogger.info("[JWT_FILTER] Using test user mode")
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
            jwtLogger.info("[JWT_FILTER] Test user authentication set successfully")
        } else {

            val token = resolveToken(request)
            jwtLogger.info("[JWT_FILTER] JWT Token resolution: ${if (token != null) "Token extracted successfully" else "No token found"}")

            if (token != null) {
                jwtLogger.info("[JWT_FILTER] Starting JWT token validation...")
                try {
                    val isValidToken = jwtProvider.validateToken(token)
                    jwtLogger.info("[JWT_FILTER] Token validation result: $isValidToken")
                    
                    if (isValidToken) {
                        val claims = jwtProvider.getClaimsSafely(token)
                        jwtLogger.info("[JWT_FILTER] Claims extraction: ${if (claims != null) "Success" else "Failed"}")
                        
                        if (claims != null) {
                            val userId = claims.subject.toLong()
                            val nickname = claims.get("nickname", String::class.java)
                            jwtLogger.info("[JWT_FILTER] Extracted claims - userId: $userId, nickname: $nickname")

                            // Check if token exists in database - CRITICAL CHECK
                            val tokenInDatabase = jwtProvider.isTokenInDatabase(token)
                            jwtLogger.info("[JWT_FILTER] Token database check: $tokenInDatabase")

                            if (!tokenInDatabase) {
                                jwtLogger.error("[JWT_FILTER] AUTHENTICATION FAILED: Token not found in database or expired")
                                jwtLogger.error("[JWT_FILTER] userId: $userId, nickname: $nickname")
                                jwtLogger.error("[JWT_FILTER] This is likely the cause of 'Anonymous user cannot create game room' error")
                                SecurityContextHolder.clearContext()
                            } else {
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
                                
                                jwtLogger.info("[JWT_FILTER] JWT Authentication SUCCESS: userId=${userId}, nickname=${nickname}")
                                jwtLogger.info("[JWT_FILTER] SecurityContext set with UserPrincipal: ${userPrincipal::class.java.simpleName}")
                                jwtLogger.info("[JWT_FILTER] Token verified in database - authentication complete")
                            }
                        } else {
                            jwtLogger.error("[JWT_FILTER] Cannot extract claims from token - clearing SecurityContext")
                            SecurityContextHolder.clearContext()
                        }
                    } else {
                        jwtLogger.warn("[JWT_FILTER] Invalid or expired JWT Token - clearing SecurityContext")
                        SecurityContextHolder.clearContext()
                    }
                } catch (e: ExpiredJwtException) {
                    jwtLogger.warn("[JWT_FILTER] JWT Token expired: ${e.message} - clearing SecurityContext")
                    SecurityContextHolder.clearContext()
                } catch (e: Exception) {
                    jwtLogger.error("[JWT_FILTER] JWT Authentication Error: ${e.message} - clearing SecurityContext", e)
                    SecurityContextHolder.clearContext()
                }
            } else {
                jwtLogger.info("[JWT_FILTER] No JWT token found - proceeding with anonymous authentication")
            }
        }

        // Log final authentication state before proceeding
        val finalAuth = SecurityContextHolder.getContext().authentication
        if (finalAuth != null) {
            jwtLogger.info("[JWT_FILTER] Final authentication: ${finalAuth.principal::class.java.simpleName} - ${finalAuth.principal}")
            jwtLogger.info("[JWT_FILTER] Is authenticated: ${finalAuth.isAuthenticated}")
        } else {
            jwtLogger.info("[JWT_FILTER] Final authentication: null (will be anonymous)")
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
