package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.request.SurvivalVoteRequest
import org.example.kotlin_liargame.domain.game.dto.request.VoteRequest
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.dto.response.VoteResponse
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class VotingService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler,
    private val defenseService: DefenseService,
    private val gameMonitoringService: GameMonitoringService
) {
    
    // ... (기존의 다른 메서드들은 유지)

    @Transactional
    fun castVote(gameNumber: Int, voterUserId: Long, targetPlayerId: Long): VoteResponse {
        val game = gameRepository.findByGameNumberWithLock(gameNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gameState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val voter = playerRepository.findByGameAndUserId(game, voterUserId)
            ?: throw RuntimeException("You are not in this game")

        if (!voter.isAlive) {
            throw RuntimeException("You are eliminated from the game")
        }

        if (voter.state != PlayerState.WAITING_FOR_VOTE) {
            throw RuntimeException("You are not in the voting phase")
        }

        val targetPlayer = playerRepository.findById(targetPlayerId).orElse(null)
            ?: throw RuntimeException("Target player not found")

        if (targetPlayer.game.id != game.id) {
            throw RuntimeException("Target player is not in this game")
        }

        if (!targetPlayer.isAlive) {
            throw RuntimeException("Target player is eliminated from the game")
        }

        voter.voteFor(targetPlayer.id)
        playerRepository.save(voter)

        targetPlayer.receiveVote()
        playerRepository.save(targetPlayer)

        gameMonitoringService.notifyPlayerVoted(gameNumber, voter.id, targetPlayer.id)

        val players = playerRepository.findByGame(game)
        val allPlayersVoted = players.all {
            it.state == PlayerState.VOTED || !it.isAlive ||
                    (it.state == PlayerState.WAITING_FOR_VOTE && it.hasVotingTimeExpired())
        }

        if (allPlayersVoted) {
            // Process results and then broadcast the final state
            // ... (투표 결과 처리 로직)
            val gameStateResponse = getGameState(game, voterUserId)
            gameMonitoringService.broadcastGameState(game, gameStateResponse)
        }
        
        return VoteResponse(
            voterNickname = voter.nickname,
            targetNickname = targetPlayer.nickname,
            success = true
        )
    }

    @Transactional
    fun vote(req: VoteRequest, session: HttpSession): GameStateResponse {
        val userId = getCurrentUserId(session)
        castVote(req.gameNumber, userId, req.targetPlayerId)
        return getGameState(gameRepository.findByGameNumber(req.gameNumber)!!, session)
    }

    @Transactional
    fun survivalVote(req: SurvivalVoteRequest, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumberWithLock(req.gameNumber)
            ?: throw RuntimeException("Game not found")

        // ... (survivalVote 로직)

        val gameStateResponse = getGameState(game, session)
        gameMonitoringService.broadcastGameState(game, gameStateResponse)
        return gameStateResponse
    }

    private fun getCurrentUserId(session: HttpSession): Long {
        return session.getAttribute("userId") as? Long
            ?: throw RuntimeException("Not authenticated")
    }

    // Simplified getGameState
    private fun getGameState(game: org.example.kotlin_liargame.domain.game.model.GameEntity, session: HttpSession): GameStateResponse {
        val players = playerRepository.findByGame(game)
        val currentUserId = getCurrentUserId(session)
        return GameStateResponse.from(game, players, currentUserId, org.example.kotlin_liargame.domain.game.model.enum.GamePhase.VOTING_FOR_LIAR)
    }

    private fun getGameState(game: org.example.kotlin_liargame.domain.game.model.GameEntity, userId: Long): GameStateResponse {
        val players = playerRepository.findByGame(game)
        return GameStateResponse.from(game, players, userId, org.example.kotlin_liargame.domain.game.model.enum.GamePhase.VOTING_FOR_LIAR)
    }
}
