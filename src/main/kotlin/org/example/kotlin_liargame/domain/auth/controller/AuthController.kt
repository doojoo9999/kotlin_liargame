package org.example.kotlin_liargame.domain.auth.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.auth.dto.response.LoginResponse
import org.example.kotlin_liargame.domain.user.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val userService: UserService
) {

    @PostMapping("/login")
    fun login(
        @RequestBody request: LoginRequest, 
        session: HttpSession
    ): ResponseEntity<LoginResponse> {
        val user = userService.authenticate(request.nickname, request.password)

        session.setAttribute("userId", user.id)
        session.setAttribute("nickname", user.nickname)

        return ResponseEntity.ok(LoginResponse(
            success = true,
            userId = user.id,
            nickname = user.nickname
        ))
    }

    @PostMapping("/logout")
    fun logout(session: HttpSession): ResponseEntity<Map<String, Boolean>> {
        session.invalidate()
        return ResponseEntity.ok(mapOf("success" to true))
    }

    @PostMapping("/refresh-session")
    fun refreshSession(session: HttpSession): ResponseEntity<Map<String, Any>> {
        // 세션이 유효한지 확인
        val userId = session.getAttribute("userId") as? Long
        val nickname = session.getAttribute("nickname") as? String

        if (userId == null) {
            return ResponseEntity.badRequest().body(mapOf(
                "success" to false,
                "message" to "세션이 유효하지 않습니다."
            ))
        }

        // 세션 갱신 (기존 속성 유지)
        session.setAttribute("userId", userId)
        if (nickname != null) {
            session.setAttribute("nickname", nickname)
        }

        // 세션 속성 모두 출력 (디버깅용)
        println("[DEBUG] Session refreshed. Attributes:")
        session.attributeNames.asIterator().forEach { name ->
            println("[DEBUG]   - $name: ${session.getAttribute(name)}")
        }

        return ResponseEntity.ok(mapOf(
            "success" to true,
            "userId" to userId,
            "nickname" to (nickname ?: "Unknown"),
            "sessionId" to session.id
        ))
    }

    @GetMapping("/me")
    fun getCurrentUser(session: HttpSession): ResponseEntity<Map<String, Any>> {
        val userId = session.getAttribute("userId") as? Long
        val nickname = session.getAttribute("nickname") as? String

        if (userId == null) {
            return ResponseEntity.status(401).body(mapOf(
                "authenticated" to false,
                "message" to "Not authenticated"
            ))
        }

        // 세션 정보 출력 (디버깅용)
        println("[DEBUG] Session check. ID: ${session.id}, Attributes:")
        session.attributeNames.asIterator().forEach { name ->
            println("[DEBUG]   - $name: ${session.getAttribute(name)}")
        }

        try {
            val user = userService.findById(userId)
            return ResponseEntity.ok(mapOf(
                "authenticated" to true,
                "userId" to userId,
                "nickname" to (user.nickname ?: nickname ?: "Unknown"),
                "sessionId" to session.id
            ))
        } catch (e: Exception) {
            // 사용자 조회 실패 시에도 세션 정보는 반환
            println("[WARN] Failed to fetch user details: ${e.message}")
            return ResponseEntity.ok(mapOf(
                "authenticated" to true,
                "userId" to userId,
                "nickname" to (nickname ?: "Unknown"),
                "sessionId" to session.id
            ))
        }
    }
}
