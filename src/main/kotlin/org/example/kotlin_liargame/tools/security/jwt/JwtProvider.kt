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
        private const val ACCESS_TOKEN_EXPIRE_TIME = 1000L * 60 * 30
        private const val REFRESH_TOKEN_EXPIRE_TIME = 1000L * 60 * 60 * 24 * 7
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

    fun generateAccessToken(userId: Long, nickname: String): String {
        return generateToken(userId.toString(), nickname,ACCESS_TOKEN_EXPIRE_TIME)
    }

    fun generateRefreshToken(userId: Long, nickname: String): String {
        return generateToken(userId.toString(), nickname, REFRESH_TOKEN_EXPIRE_TIME)
    }

    fun getNickname(token: String): String {
        return getClaims(token).get("nickname", String::class.java)
    }

    fun getClaims(token: String): Claims {
        return Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .body
    }

    fun generateToken(userId: String, nickname: String, expireTime: Long): String {
        return jwtBuild(userId, nickname, expireTime)
    }

    fun jwtBuild(userId: String, nickname: String, expireTime: Long): String {
        val now = Date()
        return Jwts.builder()
            .setSubject(userId)
            .claim("nickname", nickname)
            .setIssuedAt(now)
            .setExpiration(Date(now.time + expireTime))
            .signWith(secretKey)
            .compact()
    }


}