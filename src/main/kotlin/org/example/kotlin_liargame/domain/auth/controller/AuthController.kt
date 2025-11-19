package org.example.kotlin_liargame.domain.auth.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpSession
import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.auth.dto.response.AuthCheckResponse
import org.example.kotlin_liargame.domain.auth.dto.response.LoginResponse
import org.example.kotlin_liargame.domain.auth.dto.response.LogoutResponseDto
import org.example.kotlin_liargame.domain.auth.dto.response.SessionRefreshResponse
import org.example.kotlin_liargame.domain.user.service.UserService
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.example.kotlin_liargame.global.security.SessionRegistrationResult
import org.slf4j.LoggerFactory
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val userService: UserService,
    private val sessionManagementService: SessionManagementService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @Operation(summary = "로그인", description = "사용자 인증 후 세션을 생성합니다.")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "로그인 성공"),
            ApiResponse(responseCode = "401", description = "인증 실패"),
            ApiResponse(responseCode = "500", description = "서버 오류")
        ]
    )
    @PostMapping("/login")
    fun login(
        @RequestBody @Valid request: LoginRequest,
        session: HttpSession
    ): ResponseEntity<LoginResponse> {
        return try {
            logger.debug("Login request received - nickname: {}, password: {}", request.nickname, if (request.password.isNullOrEmpty()) "empty" else "provided")
            
            val user = userService.authenticate(request.getSanitizedNickname(), request.getEffectivePassword())

            // SessionManagementService에서 동시 세션 제어와 등록을 안전하게 처리
            val result = sessionManagementService.registerSession(session, user.nickname, user.id)

            if (result != SessionRegistrationResult.SUCCESS) {
                logger.error("Session registration failed for user: {}", user.nickname)
                return ResponseEntity.status(500).body(LoginResponse(
                    success = false,
                    userId = null,
                    nickname = null,
                    message = "세션 등록에 실패했습니다."
                ))
            }

            logger.info("User authenticated and session created: {}", user.nickname)
            ResponseEntity.ok(LoginResponse(
                success = true,
                userId = user.id,
                nickname = user.nickname
            ))
        } catch (e: Exception) {
            logger.error("Login failed: {}", e.message, e)
            ResponseEntity.status(500).body(LoginResponse(
                success = false,
                userId = null,
                nickname = null,
                message = "로그인 처리 중 오류가 발생했습니다: ${e.message}"
            ))
        }
    }

    @Operation(summary = "로그아웃", description = "세션을 무효화하고 관련 쿠키를 제거합니다.")
    @PostMapping("/logout")
    fun logout(
        session: HttpSession,
        request: HttpServletRequest
    ): ResponseEntity<LogoutResponseDto> {
        // Ensure session data is removed before issuing cookie cleanup
        sessionManagementService.logout(session)

        val secureRequest = request.isSecure ||
            request.getHeader("X-Forwarded-Proto")?.equals("https", ignoreCase = true) == true

        val responseBuilder = ResponseEntity.ok()
        SESSION_COOKIE_NAMES
            .map { buildExpiredSessionCookie(it, secureRequest) }
            .forEach { cookie -> responseBuilder.header(HttpHeaders.SET_COOKIE, cookie.toString()) }

        return responseBuilder.body(LogoutResponseDto())
    }

    @Operation(summary = "세션 갱신", description = "활성 세션을 검증하고 최신 상태로 갱신합니다.")
    @PostMapping("/refresh-session")
    fun refreshSession(session: HttpSession): ResponseEntity<SessionRefreshResponse> {
        // 세션이 유효한지 확인 (JSON 역직렬화 방식)
        val validationResult = sessionManagementService.validateSession(session)

        if (validationResult != org.example.kotlin_liargame.global.security.SessionValidationResult.VALID) {
            return ResponseEntity.badRequest().body(
                SessionRefreshResponse(
                    success = false,
                    userId = null,
                    nickname = null,
                    message = "세션이 유효하지 않습니다."
                )
            )
        }

        val userId = sessionManagementService.getUserId(session)
        val nickname = sessionManagementService.getNickname(session)

        // null 체크 후 안전한 타입 변환
        if (userId == null || nickname == null) {
            return ResponseEntity.badRequest().body(
                SessionRefreshResponse(
                    success = false,
                    userId = null,
                    nickname = null,
                    message = "세션 데이터를 가져올 수 없습니다."
                )
            )
        }

        logger.debug("Session refreshed for user: {} (ID: {})", nickname, userId)

        return ResponseEntity.ok(
            SessionRefreshResponse(
                success = true,
                userId = userId,
                nickname = nickname,
                message = "세션이 갱신되었습니다."
            )
        )
    }

    @Operation(summary = "인증 상태 조회", description = "현재 세션의 인증 상태를 확인합니다.")
    @GetMapping("/check")
    fun checkAuth(session: HttpSession): ResponseEntity<AuthCheckResponse> {
        val userId = sessionManagementService.getUserId(session)
        val nickname = sessionManagementService.getNickname(session)

        return if (userId != null && nickname != null) {
            ResponseEntity.ok(
                AuthCheckResponse(
                    authenticated = true,
                    userId = userId,
                    nickname = nickname
                )
            )
        } else {
            ResponseEntity.ok(
                AuthCheckResponse(
                    authenticated = false,
                    userId = null,
                    nickname = null
                )
            )
        }
    }
    companion object {
        private val SESSION_COOKIE_NAMES = listOf("SESSION", "JSESSIONID")

        private fun buildExpiredSessionCookie(name: String, secure: Boolean): ResponseCookie {
            return ResponseCookie.from(name, "")
                .path("/")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .maxAge(java.time.Duration.ZERO)
                .build()
        }
    }

}


