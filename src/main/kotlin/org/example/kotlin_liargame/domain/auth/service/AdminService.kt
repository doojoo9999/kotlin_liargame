package org.example.kotlin_liargame.domain.auth.service

import org.example.kotlin_liargame.domain.auth.dto.request.AdminLoginRequest
import org.example.kotlin_liargame.domain.auth.dto.response.TokenResponse
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.tools.security.jwt.JwtProvider
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class AdminService(
    private val jwtProvider: JwtProvider,
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val userRepository: UserRepository,
    @Value("\${admin.password:admin123}") // 테스트시에만 사용
    private val adminPassword: String
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
    
    companion object {
        private const val ADMIN_USER_ID = -1L
        private const val ADMIN_NICKNAME = "admin"
    }

    fun login(request: AdminLoginRequest): TokenResponse {
        logger.debug("관리자 로그인 시도")
        
        if (request.password != adminPassword) {
            logger.debug("관리자 로그인 실패: 잘못된 비밀번호")
            throw IllegalArgumentException("잘못된 관리자 비밀번호입니다.")
        }
        
        // Generate admin tokens
        val accessToken = jwtProvider.generateAccessToken(ADMIN_USER_ID, ADMIN_NICKNAME)
        val refreshToken = jwtProvider.generateRefreshToken(ADMIN_USER_ID, ADMIN_NICKNAME)
        
        logger.debug("관리자 로그인 성공")
        
        return TokenResponse(accessToken = accessToken, refreshToken = refreshToken)
    }

    fun getStatistics(): AdminStatsResponse {
        logger.debug("관리자 통계 조회")
        
        val allGames = gameRepository.findAll()
        val totalGames = allGames.size
        val activeGames = allGames.count { game ->
            game.gState == org.example.kotlin_liargame.domain.game.model.enum.GameState.WAITING ||
            game.gState == org.example.kotlin_liargame.domain.game.model.enum.GameState.IN_PROGRESS
        }
        val totalPlayers = playerRepository.count().toInt()
        val totalUsers = userRepository.count().toInt()
        val playersInLobby = totalUsers - totalPlayers
        
        return AdminStatsResponse(
            totalPlayers = totalUsers,
            activeGames = activeGames,
            totalGames = totalGames,
            playersInLobby = playersInLobby
        )
    }

    fun getAllPlayers(): AdminPlayersResponse {
        logger.debug("관리자 플레이어 목록 조회")
        
        val users = userRepository.findAll()
        val allPlayers = playerRepository.findAll()
        val playerUserIds = allPlayers.map { it.userId }.toSet()
        
        val players = users.map { user ->
            val isInGame = playerUserIds.contains(user.id)
            AdminPlayerInfo(
                id = user.id!!,
                nickname = user.nickname,
                status = if (isInGame) "게임중" else "로비"
            )
        }
        
        return AdminPlayersResponse(players = players)
    }

    fun terminateGameRoom(gameNumber: Int): Boolean {
        logger.debug("게임방 강제 종료: {}", gameNumber)
        
        val allGames = gameRepository.findAll()
        val game = allGames.find { it.gNumber == gameNumber }
            ?: throw IllegalArgumentException("존재하지 않는 게임방입니다.")
        
        // Update game state to ended
        game.gState = org.example.kotlin_liargame.domain.game.model.enum.GameState.ENDED
        gameRepository.save(game)
        
        // Remove all players from the game
        val playersToRemove = playerRepository.findByGame(game)
        playerRepository.deleteAll(playersToRemove)
        
        logger.debug("게임방 강제 종료 완료: {}", gameNumber)
        return true
    }
}

data class AdminStatsResponse(
    val totalPlayers: Int,
    val activeGames: Int,
    val totalGames: Int,
    val playersInLobby: Int
)

data class AdminPlayersResponse(
    val players: List<AdminPlayerInfo>
)

data class AdminPlayerInfo(
    val id: Long,
    val nickname: String,
    val status: String
)