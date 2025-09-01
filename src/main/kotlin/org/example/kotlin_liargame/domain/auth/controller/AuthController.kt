package org.example.kotlin_liargame.domain.auth.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.auth.dto.response.LoginResponse
import org.example.kotlin_liargame.domain.user.service.UserService
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val userService: UserService,
    private val sessionManagementService: SessionManagementService
) {

    @PostMapping("/login")
    fun login(
        @RequestBody request: LoginRequest,
        session: HttpSession
    ): ResponseEntity<LoginResponse> {
        val user = userService.authenticate(request.nickname, request.password)

        // Explicitly invalidate the current session before registering a new one
        // This handles cases where a user logs in with a different nickname from the same browser
        session.invalidate()

        // After invalidation, the session object might be new or re-initialized.
        // Ensure we use the correct session object for registration.
        // Spring typically re-creates the session if it's invalidated and then accessed.
        sessionManagementService.registerSession(session, user.nickname, user.id)

        return ResponseEntity.ok(LoginResponse(
            success = true,
            userId = user.id,
            nickname = user.nickname
        ))
    }

    @PostMapping("/logout")
    fun logout(session: HttpSession): ResponseEntity<Map<String, Boolean>> {
        // JSON 세션 데이터 완전 삭제
        sessionManagementService.logout(session)
        return ResponseEntity.ok(mapOf("success" to true))
    }

    @PostMapping("/refresh-session")
    fun refreshSession(session: HttpSession): ResponseEntity<Map<String, Any>> {
        // 세션이 유효한지 확인 (JSON 역직렬화 방식)
        val validationResult = sessionManagementService.validateSession(session)

        if (validationResult != org.example.kotlin_liargame.global.security.SessionValidationResult.VALID) {
            return ResponseEntity.badRequest().body(mapOf(
                "success" to false,
                "message" to "세션이 유효하지 않습니다."
            ))
        }

        val userId = sessionManagementService.getUserId(session)
        val nickname = sessionManagementService.getNickname(session)

        // null 체크 후 안전한 타입 변환
        if (userId == null || nickname == null) {
            return ResponseEntity.badRequest().body(mapOf(
                "success" to false,
                "message" to "세션 데이터를 가져올 수 없습니다."
            ))
        }

        println("[DEBUG] Session refreshed for user: $nickname (ID: $userId)")

        return ResponseEntity.ok(mapOf(
            "success" to true,
            "userId" to userId as Any,
            "nickname" to nickname as Any,
            "message" to "세션이 갱신되었습니다."
        ))
    }

    @GetMapping("/check")
    fun checkAuth(session: HttpSession): ResponseEntity<Map<String, Any>> {
        val userId = sessionManagementService.getUserId(session)
        val nickname = sessionManagementService.getNickname(session)

        return if (userId != null && nickname != null) {
            ResponseEntity.ok(mapOf(
                "authenticated" to true,
                "userId" to userId as Any,
                "nickname" to nickname as Any
            ))
        } else {
            ResponseEntity.ok(mapOf(
                "authenticated" to false
            ))
        }
    }
}
