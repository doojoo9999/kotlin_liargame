package org.example.kotlin_liargame.tools.security.jwt

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.example.kotlin_liargame.domain.user.repository.UserTokenRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.security.Key
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.*

@Component
class JwtProvider(
    private val userTokenRepository: UserTokenRepository
) {
    companion object {
        private const val ACCESS_TOKEN_EXPIRE_TIME = 1000L * 60 * 30
        private const val REFRESH_TOKEN_EXPIRE_TIME = 1000L * 60 * 60 * 24 * 7
        private val secretKey: Key = Keys.secretKeyFor(SignatureAlgorithm.HS256)
    }
    
    private val logger = LoggerFactory.getLogger(this::class.java)

    fun validateToken(token: String): Boolean {
        return try {
            val claims = getClaims(token)
            val isTokenValid = !claims.expiration.before(Date())
            
            if (!isTokenValid) {
                logger.debug("Token is expired by JWT standards")
                return false
            }
            
            return true
        } catch (e: Exception) {
            logger.error("Error validating token", e)
            false
        }
    }
    
    fun isTokenInDatabase(token: String): Boolean {
        return try {
            val exists = userTokenRepository.existsByTokenAndExpiresAtAfter(
                token, 
                LocalDateTime.now()
            )
            
            if (!exists) {
                logger.debug("Token not found in database or is expired")
            }
            
            exists
        } catch (e: Exception) {
            logger.error("Error checking token in database", e)
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
    
    fun getTokenExpirationTime(token: String): LocalDateTime {
        val claims = getClaims(token)
        return convertToLocalDateTime(claims.expiration)
    }
    
    fun convertToLocalDateTime(date: Date): LocalDateTime {
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
    }
    
    fun convertToDate(localDateTime: LocalDateTime): Date {
        return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant())
    }
}