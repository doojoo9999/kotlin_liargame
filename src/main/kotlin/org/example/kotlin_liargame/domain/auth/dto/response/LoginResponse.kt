package org.example.kotlin_liargame.domain.auth.dto.response

data class LoginResponse(
    val success: Boolean,
    val userId: Long?,
    val nickname: String?,
    val message: String? = null
)