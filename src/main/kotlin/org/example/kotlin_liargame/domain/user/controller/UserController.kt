package org.example.kotlin_liargame.domain.user.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.dto.response.UserStatsResponse
import org.example.kotlin_liargame.domain.user.service.UserService
import org.example.kotlin_liargame.global.util.SessionUtil
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/user")
class UserController(
    private val userService: UserService,
    private val sessionUtil: SessionUtil // SessionUtil 주입
) {
    @PostMapping("/add")
    fun addUser(@RequestBody req: UserAddRequest) {
        userService.createUser(req)
    }

    @GetMapping("/stats")
    fun getUserStats(session: HttpSession): ResponseEntity<UserStatsResponse> {
        // JSON 직렬화 방식으로 사용자 ID 조회
        val userId = sessionUtil.getUserId(session)
            ?: return ResponseEntity.status(401).build() // Unauthorized
        
        val stats = userService.getUserStats(userId)
        return ResponseEntity.ok(stats)
    }
}