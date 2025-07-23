package org.example.kotlin_liargame.tools.security.jwt

data class JwtClaims(
    val nickname: String,
    val sessionId: String,
    val createdAt: Long
)