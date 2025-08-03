package org.example.kotlin_liargame.tools.security.jwt

import jakarta.servlet.http.HttpServletRequest
import org.example.kotlin_liargame.tools.security.UserPrincipal
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/v1/debug")
class JwtDiagnosticController(
    private val jwtProvider: JwtProvider
) {
    
    private val logger = LoggerFactory.getLogger(this::class.java)
    
    data class JwtDiagnosticResponse(
        val timestamp: LocalDateTime = LocalDateTime.now(),
        val authenticationStatus: String,
        val principalType: String?,
        val principalValue: String?,
        val userId: Long?,
        val nickname: String?,
        val tokenPresent: Boolean,
        val tokenValid: Boolean?,
        val tokenInDatabase: Boolean?,
        val authorizationHeader: String?,
        val errorMessage: String?,
        val claims: Map<String, Any>?
    )
    
    @GetMapping("/jwt-status")
    fun getJwtStatus(request: HttpServletRequest): ResponseEntity<JwtDiagnosticResponse> {
        logger.info("[JWT_DIAGNOSTIC] JWT status check requested")
        
        try {
            val authentication = SecurityContextHolder.getContext().authentication
            val authHeader = request.getHeader("Authorization")
            val token = extractTokenFromHeader(authHeader)
            
            logger.info("[JWT_DIAGNOSTIC] Authentication: ${authentication?.principal?.javaClass?.simpleName}")
            logger.info("[JWT_DIAGNOSTIC] Token present: ${token != null}")
            
            val response = when {
                authentication == null -> {
                    JwtDiagnosticResponse(
                        authenticationStatus = "NO_AUTHENTICATION",
                        principalType = null,
                        principalValue = null,
                        userId = null,
                        nickname = null,
                        tokenPresent = token != null,
                        tokenValid = token?.let { jwtProvider.validateToken(it) },
                        tokenInDatabase = token?.let { jwtProvider.isTokenInDatabase(it) },
                        authorizationHeader = authHeader?.take(50),
                        errorMessage = "No authentication found in SecurityContext",
                        claims = token?.let { getTokenClaims(it) }
                    )
                }
                
                authentication.principal is UserPrincipal -> {
                    val userPrincipal = authentication.principal as UserPrincipal
                    JwtDiagnosticResponse(
                        authenticationStatus = "AUTHENTICATED_USER_PRINCIPAL",
                        principalType = "UserPrincipal",
                        principalValue = userPrincipal.toString(),
                        userId = userPrincipal.userId,
                        nickname = userPrincipal.nickname,
                        tokenPresent = token != null,
                        tokenValid = token?.let { jwtProvider.validateToken(it) },
                        tokenInDatabase = token?.let { jwtProvider.isTokenInDatabase(it) },
                        authorizationHeader = authHeader?.take(50),
                        errorMessage = null,
                        claims = token?.let { getTokenClaims(it) }
                    )
                }
                
                authentication.principal is String -> {
                    val principalString = authentication.principal as String
                    JwtDiagnosticResponse(
                        authenticationStatus = if (principalString == "anonymousUser") "ANONYMOUS_USER" else "STRING_PRINCIPAL",
                        principalType = "String",
                        principalValue = principalString,
                        userId = null,
                        nickname = null,
                        tokenPresent = token != null,
                        tokenValid = token?.let { jwtProvider.validateToken(it) },
                        tokenInDatabase = token?.let { jwtProvider.isTokenInDatabase(it) },
                        authorizationHeader = authHeader?.take(50),
                        errorMessage = if (principalString == "anonymousUser") "User is anonymous - JWT authentication failed" else null,
                        claims = token?.let { getTokenClaims(it) }
                    )
                }
                
                else -> {
                    JwtDiagnosticResponse(
                        authenticationStatus = "UNKNOWN_PRINCIPAL",
                        principalType = authentication.principal?.javaClass?.simpleName,
                        principalValue = authentication.principal?.toString(),
                        userId = null,
                        nickname = null,
                        tokenPresent = token != null,
                        tokenValid = token?.let { jwtProvider.validateToken(it) },
                        tokenInDatabase = token?.let { jwtProvider.isTokenInDatabase(it) },
                        authorizationHeader = authHeader?.take(50),
                        errorMessage = "Unknown principal type: ${authentication.principal?.javaClass?.simpleName}",
                        claims = token?.let { getTokenClaims(it) }
                    )
                }
            }
            
            logger.info("[JWT_DIAGNOSTIC] Response: $response")
            return ResponseEntity.ok(response)
            
        } catch (e: Exception) {
            logger.error("[JWT_DIAGNOSTIC] Error during diagnostic check", e)
            return ResponseEntity.ok(
                JwtDiagnosticResponse(
                    authenticationStatus = "ERROR",
                    principalType = null,
                    principalValue = null,
                    userId = null,
                    nickname = null,
                    tokenPresent = false,
                    tokenValid = null,
                    tokenInDatabase = null,
                    authorizationHeader = null,
                    errorMessage = "Diagnostic error: ${e.message}",
                    claims = null
                )
            )
        }
    }
    
    @PostMapping("/test-room-creation")
    fun testRoomCreation(): ResponseEntity<Map<String, Any>> {
        logger.info("[JWT_DIAGNOSTIC] Test room creation requested")
        
        val authentication = SecurityContextHolder.getContext().authentication
        val response = mutableMapOf<String, Any>()
        
        response["timestamp"] = LocalDateTime.now()
        response["authenticationPresent"] = authentication != null
        
        if (authentication != null) {
            response["principalType"] = authentication.principal?.javaClass?.simpleName ?: "null"
            response["principalValue"] = authentication.principal?.toString() ?: "null"
            response["isAuthenticated"] = authentication.isAuthenticated
            
            when (val principal = authentication.principal) {
                is UserPrincipal -> {
                    response["status"] = "SUCCESS"
                    response["message"] = "User is properly authenticated with UserPrincipal"
                    response["userId"] = principal.userId
                    response["nickname"] = principal.nickname
                    response["canCreateRoom"] = true
                }
                is String -> {
                    if (principal == "anonymousUser") {
                        response["status"] = "FAILED"
                        response["message"] = "Anonymous user cannot create game room. Please login first."
                        response["canCreateRoom"] = false
                        response["issue"] = "JWT authentication failed - user is anonymous"
                    } else {
                        response["status"] = "PARTIAL"
                        response["message"] = "String principal found but not UserPrincipal"
                        response["canCreateRoom"] = false
                        response["issue"] = "Expected UserPrincipal but got String"
                    }
                }
                else -> {
                    response["status"] = "FAILED"
                    response["message"] = "Unknown principal type"
                    response["canCreateRoom"] = false
                    response["issue"] = "Unknown principal type: ${principal?.javaClass?.simpleName}"
                }
            }
        } else {
            response["status"] = "FAILED"
            response["message"] = "No authentication found"
            response["canCreateRoom"] = false
            response["issue"] = "No authentication in SecurityContext"
        }
        
        logger.info("[JWT_DIAGNOSTIC] Test room creation response: $response")
        return ResponseEntity.ok(response)
    }
    
    private fun extractTokenFromHeader(authHeader: String?): String? {
        return if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authHeader.substring(7)
        } else {
            null
        }
    }
    
    private fun getTokenClaims(token: String): Map<String, Any>? {
        return try {
            val claims = jwtProvider.getClaimsSafely(token)
            claims?.let { 
                mapOf<String, Any>(
                    "subject" to (it.subject ?: "null"),
                    "nickname" to (it.get("nickname", String::class.java) ?: "null"),
                    "issuedAt" to (it.issuedAt?.toString() ?: "null"),
                    "expiration" to (it.expiration?.toString() ?: "null")
                )
            }
        } catch (e: Exception) {
            logger.error("[JWT_DIAGNOSTIC] Error extracting claims", e)
            null
        }
    }
}