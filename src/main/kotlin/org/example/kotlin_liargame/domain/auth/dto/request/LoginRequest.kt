package org.example.kotlin_liargame.domain.auth.dto.request

data class LoginRequest (
    val username : String
){
    // For backward compatibility with the backend
    val nickname: String
        get() = username
}