package org.example.kotlin_liargame.domain.chat.service

import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

@Service
class TurnProgressService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val votingService: org.example.kotlin_liargame.domain.game.service.VotingService,
    private val gameProperties: org.example.kotlin_liargame.global.config.GameProperties,
    private val chatSystemMessenger: ChatSystemMessenger
) {
    private val scheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(1)

    fun handleAfterMessage(game: GameEntity, messageType: ChatMessageType, playerUserId: Long) {
        if (messageType != ChatMessageType.HINT) return
        if (game.currentPlayerId != playerUserId) return
        proceedToNextTurn(game)
    }

    private fun proceedToNextTurn(game: GameEntity) {
        game.currentTurnIndex += 1
        val turnOrder = game.turnOrder?.split(',') ?: emptyList()
        if (game.currentTurnIndex >= turnOrder.size) {
            startVotingPhase(game)
            return
        }
        val nextPlayerNickname = turnOrder[game.currentTurnIndex]
        val players = playerRepository.findByGame(game)
        val nextPlayer = players.find { it.nickname == nextPlayerNickname }
        if (nextPlayer != null) {
            game.currentPlayerId = nextPlayer.userId
            game.turnStartedAt = Instant.now()
            game.phaseEndTime = Instant.now().plusSeconds(gameProperties.turnTimeoutSeconds)
            gameRepository.save(game)
            scheduler.schedule({
                chatSystemMessenger.sendSystemMessage(game, "🎯 ${nextPlayer.nickname}님의 차례입니다! 힌트를 말해주세요. (${gameProperties.turnTimeoutSeconds}초)")
            }, 500, TimeUnit.MILLISECONDS)
        }
    }

    private fun startVotingPhase(game: GameEntity) {
        try {
            votingService.startVotingPhase(game)
            scheduler.schedule({
                chatSystemMessenger.sendSystemMessage(game, "🗳️ 투표 단계가 시작되었습니다! 라이어라고 생각하는 플레이어에게 투표해주세요.")
            }, 1000, TimeUnit.MILLISECONDS)
        } catch (e: Exception) {
            println("[ERROR] Failed starting voting phase: ${e.message}")
        }
    }
}

