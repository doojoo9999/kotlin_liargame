package org.example.kotlin_liargame.domain.user.controller

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.dto.response.UserStatsResponse
import org.example.kotlin_liargame.domain.user.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/user")
class UserController(
    private val userService: UserService
) {
    @PostMapping("/add")
    fun addUser(@RequestBody req: UserAddRequest) {
        userService.createUser(req)
    }

    @GetMapping("/stats")
    fun getUserStats(session: HttpSession): ResponseEntity<UserStatsResponse> {
        val userId = session.getAttribute("userId") as? Long
            ?: return ResponseEntity.status(401).build() // Unauthorized

        val stats = userService.getUserStats(userId)
        return ResponseEntity.ok(stats)
    }
}