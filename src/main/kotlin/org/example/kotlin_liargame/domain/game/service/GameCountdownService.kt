package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.response.CountdownResponse
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.global.exception.GameNotFoundException
import org.example.kotlin_liargame.global.session.SessionService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.util.concurrent.ScheduledFuture

@Service
@Transactional
class GameCountdownService(
    private val gameRepository: GameRepository,
    private val playerReadinessService: PlayerReadinessService,
    private val sessionService: SessionService,
    private val gameMonitoringService: GameMonitoringService,
    private val gameProgressService: GameProgressService,
    private val taskScheduler: TaskScheduler
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    private val activeCountdowns = mutableMapOf<Int, ScheduledFuture<*>>()

    fun startCountdown(gameNumber: Int, session: HttpSession): CountdownResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        val nickname = sessionService.getCurrentUserNickname(session)

        if (game.gameOwner != nickname) {
            throw IllegalStateException("방장만 게임을 시작할 수 있습니다.")
        }

        if (game.gameState != GameState.WAITING) {
            throw IllegalStateException("게임이 대기 상태가 아닙니다.")
        }

        val allReady = playerReadinessService.areAllPlayersReady(gameNumber)
        if (!allReady) {
            throw IllegalStateException("모든 플레이어가 준비되지 않았거나 최소 인원이 부족합니다.")
        }

        // 기존 카운트다운 취소
        cancelCountdownInternal(gameNumber)

        val countdownEndTime = Instant.now().plusSeconds(game.countdownDurationSeconds.toLong())
        game.countdownStartedAt = Instant.now()
        game.countdownEndTime = countdownEndTime
        gameRepository.save(game)

        val scheduledTask = taskScheduler.schedule({
            try {
                logger.info("Auto starting game $gameNumber after countdown")
                gameProgressService.startGameBySystem(gameNumber)
            } catch (e: Exception) {
                logger.error("Auto start failed for game $gameNumber", e)
            } finally {
                // 카운트다운 상태 정리
                cancelCountdownInternal(gameNumber)
            }
        }, countdownEndTime)

        activeCountdowns[gameNumber] = scheduledTask

        gameMonitoringService.notifyCountdownStarted(game, countdownEndTime)

        return CountdownResponse(
            gameNumber = gameNumber,
            countdownEndTime = countdownEndTime,
            durationSeconds = game.countdownDurationSeconds,
            canCancel = true
        )
    }

    fun cancelCountdown(gameNumber: Int): CountdownResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        cancelCountdownInternal(gameNumber)

        game.countdownStartedAt = null
        game.countdownEndTime = null
        gameRepository.save(game)

        gameMonitoringService.notifyCountdownCancelled(game)

        return CountdownResponse(
            gameNumber = gameNumber,
            countdownEndTime = null,
            durationSeconds = 0,
            canCancel = false
        )
    }

    private fun cancelCountdownInternal(gameNumber: Int) {
        try {
            activeCountdowns[gameNumber]?.cancel(true)
        } catch (e: Exception) {
            logger.warn("Failed to cancel scheduled countdown for game $gameNumber: ${e.message}")
        } finally {
            activeCountdowns.remove(gameNumber)
        }
    }

    fun getCountdownStatus(gameNumber: Int): CountdownResponse? {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return null

        return if (game.countdownEndTime != null && game.countdownStartedAt != null) {
            val remaining = Duration.between(Instant.now(), game.countdownEndTime).seconds.toInt()
            CountdownResponse(
                gameNumber = gameNumber,
                countdownEndTime = game.countdownEndTime,
                durationSeconds = remaining.coerceAtLeast(0),
                canCancel = remaining > 0
            )
        } else null
    }
}

