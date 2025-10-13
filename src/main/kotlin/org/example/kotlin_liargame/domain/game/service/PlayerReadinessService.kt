package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.response.PlayerReadyResponse
import org.example.kotlin_liargame.domain.game.model.PlayerReadinessEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerReadinessRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.global.exception.GameNotFoundException
import org.example.kotlin_liargame.global.session.SessionService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional
class PlayerReadinessService(
    private val playerReadinessRepository: PlayerReadinessRepository,
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val sessionService: SessionService,
    private val gameMonitoringService: GameMonitoringService,
    private val gameProperties: org.example.kotlin_liargame.global.config.GameProperties
) {

    fun togglePlayerReady(gameNumber: Int, session: HttpSession): PlayerReadyResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        if (game.gameState != GameState.WAITING) {
            throw IllegalStateException("게임이 대기 상태가 아닙니다.")
        }

        val userId = sessionService.getCurrentUserId(session)
        val nickname = sessionService.getCurrentUserNickname(session)

        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw IllegalStateException("플레이어 정보를 찾을 수 없습니다.")

        val readiness = playerReadinessRepository.findByGameAndUserId(game, userId)
            ?: PlayerReadinessEntity(
                game = game,
                userId = userId,
                nickname = nickname
            )

        readiness.isReady = !readiness.isReady
        readiness.readyAt = if (readiness.isReady) Instant.now() else null
        readiness.updatedAt = Instant.now()

        playerReadinessRepository.save(readiness)

        val readyCount = playerReadinessRepository.countByGameAndIsReady(game, true)
        val totalPlayers = playerRepository.countByGame(game)
        val allReady = readyCount == totalPlayers && totalPlayers >= gameProperties.minPlayers

        // 브로드캐스트로 대체
        val payload = mapOf(
            "type" to "PLAYER_READY_CHANGED",
            "gameNumber" to game.gameNumber,
            "userId" to readiness.userId,
            "playerId" to player.id,
            "nickname" to readiness.nickname,
            "isReady" to readiness.isReady,
            "allReady" to allReady,
            "readyCount" to readyCount,
            "totalPlayers" to totalPlayers,
            "updatedAt" to readiness.updatedAt.toString()
        )
        gameMonitoringService.notifyPlayerReadyStateChanged(
            game = game,
            playerId = player.id,
            readiness = readiness,
            allReady = allReady,
            readyCount = readyCount,
            totalPlayers = totalPlayers
        )

        return PlayerReadyResponse(
            playerId = player.id,
            nickname = nickname,
            isReady = readiness.isReady,
            allPlayersReady = allReady,
            readyCount = readyCount,
            totalPlayers = totalPlayers
        )
    }

    fun getAllReadyStates(gameNumber: Int): List<PlayerReadyResponse> {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        val players = playerRepository.findByGame(game)
        val totalPlayers = players.size
        val readyCount = playerReadinessRepository.countByGameAndIsReady(game, true)
        val playersByUserId = players.associateBy { it.userId }

        return playerReadinessRepository.findByGame(game).map { readiness ->
            val playerId = playersByUserId[readiness.userId]?.id ?: readiness.userId
            PlayerReadyResponse(
                playerId = playerId,
                nickname = readiness.nickname,
                isReady = readiness.isReady,
                allPlayersReady = readyCount == totalPlayers && totalPlayers >= gameProperties.minPlayers,
                readyCount = readyCount,
                totalPlayers = totalPlayers
            )
        }
    }

    fun areAllPlayersReady(gameNumber: Int): Boolean {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)
        val totalPlayers = playerRepository.countByGame(game)
        if (totalPlayers < gameProperties.minPlayers) return false
        val readyCount = playerReadinessRepository.countByGameAndIsReady(game, true)
        return readyCount == totalPlayers
    }
}
