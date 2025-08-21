package org.example.kotlin_liargame.domain.auth.service

import io.micrometer.core.instrument.MeterRegistry
import org.example.kotlin_liargame.domain.auth.dto.request.AdminLoginRequest
import org.example.kotlin_liargame.domain.auth.dto.response.AdminGameInfo
import org.example.kotlin_liargame.domain.auth.dto.response.AdminPlayerInfo
import org.example.kotlin_liargame.domain.auth.dto.response.AdminPlayersResponse
import org.example.kotlin_liargame.domain.auth.dto.response.AdminStatsResponse
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.game.service.GameMonitoringService
import org.example.kotlin_liargame.domain.game.service.GameService
import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.example.kotlin_liargame.domain.user.model.UserRole
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.concurrent.atomic.AtomicInteger

@Service
@Transactional
class AdminService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val userRepository: UserRepository,
    private val gameMonitoringService: GameMonitoringService,
    private val gameService: GameService,
    private val meterRegistry: MeterRegistry
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
    private val activeGamesGauge = meterRegistry.gauge("liargame.games.active", AtomicInteger(0))

    fun login(request: AdminLoginRequest): UserEntity {
        logger.debug("관리자 로그인 시도: {}", request.nickname)
        val user = userRepository.findByNickname(request.nickname)
            ?: throw IllegalArgumentException("사용자를 찾을 수 없습니다.")

        // TODO: Implement password hashing
        if (user.password != request.password) {
            logger.debug("관리자 로그인 실패: 잘못된 비밀번호")
            throw IllegalArgumentException("잘못된 비밀번호입니다.")
        }

        if (user.role != UserRole.ADMIN) {
            logger.debug("관리자 로그인 실패: 관리자 권한이 없습니다.")
            throw SecurityException("관리자 권한이 없습니다.")
        }
        
        logger.debug("관리자 로그인 성공: {}", user.nickname)
        return user
    }

    fun grantAdminRole(userId: Long) {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }
        
        user.role = UserRole.ADMIN
        userRepository.save(user)
        logger.info("사용자 {}에게 관리자 권한을 부여했습니다.", user.nickname)
    }

    fun getStatistics(): AdminStatsResponse {
        logger.debug("관리자 통계 조회")
        
        val allGames = gameRepository.findAll()
        val totalGames = allGames.size
        val activeGames = allGames.count { game ->
            game.gameState == org.example.kotlin_liargame.domain.game.model.enum.GameState.WAITING ||
            game.gameState == org.example.kotlin_liargame.domain.game.model.enum.GameState.IN_PROGRESS
        }
        activeGamesGauge?.set(activeGames)

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

    fun getAllActiveGames(): List<AdminGameInfo> {
        logger.debug("관리자 활성 게임 목록 조회")
        val activeGames = gameRepository.findAllActiveGames()
        return activeGames.map { game ->
            val players = playerRepository.findByGame(game)
            AdminGameInfo(
                gameNumber = game.gameNumber,
                gameName = game.gameName,
                gameState = game.gameState.name,
                currentPlayerCount = players.size,
                maxPlayerCount = game.gameParticipants,
                players = players.map { p -> AdminPlayerInfo(id = p.userId, nickname = p.nickname, status = p.state.name) }
            )
        }
    }

    fun getAllPlayers(): AdminPlayersResponse {
        logger.debug("관리자 플레이어 목록 조회")
        
        val users = userRepository.findAll()
        val allPlayers = playerRepository.findAll()
        val playerUserIds = allPlayers.map { it.userId }.toSet()
        
        val players = users.map { user ->
            val isInGame = playerUserIds.contains(user.id)
            AdminPlayerInfo(
                id = user.id,
                nickname = user.nickname,
                status = if (isInGame) "게임중" else "로비"
            )
        }
        
        return AdminPlayersResponse(players = players)
    }

    fun terminateGameRoom(gameNumber: Int): Boolean {
        logger.debug("게임방 강제 종료: {}", gameNumber)
        
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("존재하지 않는 게임방입니다.")
        
        val playersInGame = playerRepository.findByGame(game)
        
        game.gameState = org.example.kotlin_liargame.domain.game.model.enum.GameState.ENDED
        gameRepository.save(game)
        
        val terminationMessage = mapOf("type" to "GAME_TERMINATED_BY_ADMIN", "message" to "관리자에 의해 게임이 종료되었습니다.")
        gameMonitoringService.broadcastGameState(game, terminationMessage)

        playerRepository.deleteAll(playersInGame)
        
        logger.debug("게임방 강제 종료 완료: {}", gameNumber)
        return true
    }

    fun kickPlayer(gameNumber: Int, userId: Long): Boolean {
        logger.debug("플레이어 강제 퇴장: gameNumber={}, userId={}", gameNumber, userId)
        
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("존재하지 않는 게임방입니다.")
        
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw IllegalArgumentException("해당 유저가 게임에 참여하고 있지 않습니다.")

        gameService.leaveGameAsSystem(gameNumber, userId)
        
        val kickMessage = mapOf("type" to "PLAYER_KICKED_BY_ADMIN", "message" to "${player.nickname}님이 관리자에 의해 강제 퇴장되었습니다.")
        gameMonitoringService.broadcastGameState(game, kickMessage)

        logger.debug("플레이어 강제 퇴장 완료")
        return true
    }
}
