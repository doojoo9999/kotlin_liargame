package org.example.kotlin_liargame.tools.security.jwt

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.security.Key
import java.util.*

@Component
class JwtProvider {
    companion object {
        private const val ACCESS_TOKEN_EXPIRE_TIME = 1000L * 60 * 30 // 30∫–
        private const val REFRESH_TOKEN_EXPIRE_TIME = 1000L * 60 * 60 * 24 * 7 // 7¿œ
        private val secretKey: Key = Keys.secretKeyFor(SignatureAlgorithm.HS256)
    }

    fun validateToken(token: String): Boolean {
        return try {
            val claims = getClaims(token)
            !claims.expiration.before(Date())
        } catch (e: Exception) {
            false
        }
    }

    fun generateAccessToken(userId: Long): String {
        return generateToken(userId.toString(), ACCESS_TOKEN_EXPIRE_TIME)
    }

    fun generateRefreshToken(userId: Long): String {
        return generateToken(userId.toString(), REFRESH_TOKEN_EXPIRE_TIME)
    }

    fun generateToken(userId: String, expireTime: Long): String {
        return jwtBuild(userId, expireTime)
    }

    fun jwtBuild(userId: String, expireTime: Long): String {
        val now = Date()
        return Jwts.builder()
            .setSubject(userId)
            .setIssuedAt(now)
            .setExpiration(Date(now.time + expireTime))
            .signWith(secretKey)
            .compact()
    }

    fun getClaims(token: String): Claims {
        return Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .body
    }
}