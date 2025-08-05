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
    
    @GetMapping("/me")
    fun getCurrentUser(session: HttpSession): ResponseEntity<Any> {
        val userId = session.getAttribute("userId") as? Long
            ?: return ResponseEntity.status(401).build()
            
        val user = userService.findById(userId)
        return ResponseEntity.ok(user)
    }
}
