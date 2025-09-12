package org.example.kotlin_liargame.domain.user.service

import org.example.kotlin_liargame.domain.game.repository.GameHistorySummaryRepository
import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.dto.response.UserStatsResponse
import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class UserService(
    private val userRepository: UserRepository,
    private val gameHistorySummaryRepository: GameHistorySummaryRepository,
    private val passwordEncoder: PasswordEncoder
) {
    fun createUser(req: UserAddRequest): UserEntity {
        val user = UserEntity(
            nickname = req.nickname,
            password = passwordEncoder.encode(req.password),
            profileImgUrl = ""
        )
        return userRepository.save(user)
    }

    fun findById(id: Long): UserEntity {
        return userRepository.findById(id)
            .orElseThrow { RuntimeException("User not found") }
    }

    fun authenticate(nickname: String, password: String?): UserEntity {
        val existingUser = userRepository.findByNickname(nickname)
        
        return if (existingUser == null) {
            // 새 사용자 생성
            val newUser = createUser(UserAddRequest(nickname = nickname, password = password ?: ""))
            newUser.apply {
                isAuthenticated = true
                userRepository.save(this)
            }
        } else {
            // 기존 사용자 비밀번호 검증
            if (!passwordEncoder.matches(password ?: "", existingUser.password)) {
                throw RuntimeException("Invalid password")
            }
            existingUser.apply {
                isAuthenticated = true
                userRepository.save(this)
            }
        }
    }


    @Scheduled(cron = "0 0 0 * * *")
    fun deactivateInactiveUsers() {
        val users = userRepository.findAll()
        users.forEach { user ->
            val lastGame = gameHistorySummaryRepository.findTopByParticipantsContainsOrderByCreatedAtDesc(user.nickname)
            if (lastGame != null && lastGame.createdAt.isBefore(LocalDateTime.now().minusDays(30))) {
                user.toUnActive()
            }
        }
    }

    fun getUserStats(userId: Long): UserStatsResponse {
        val user = findById(userId)
        return UserStatsResponse(
            userId = user.id,
            nickname = user.nickname,
            totalGames = user.totalGames,
            wins = user.totalWins,
            losses = user.totalLosses,
            winRate = user.getWinRate(),
            liarPlays = user.liarGames,
            citizenPlays = user.citizenGames
        )
    }
}
