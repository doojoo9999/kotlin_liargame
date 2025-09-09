package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.response.VotingStatusResponse
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.global.exception.GameNotFoundException
import org.example.kotlin_liargame.global.session.SessionService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class EnhancedVotingService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val votingService: VotingService,
    private val sessionService: SessionService
) {
    fun submitVote(gameNumber: Int, targetPlayerId: Long, session: HttpSession): org.example.kotlin_liargame.domain.game.dto.response.VoteResponse {
        val userId = sessionService.getCurrentUserId(session)
        return votingService.castVote(gameNumber, userId, targetPlayerId)
    }

    fun getVotingStatus(gameNumber: Int): VotingStatusResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        if (game.gameState != GameState.IN_PROGRESS) {
            return VotingStatusResponse.empty(gameNumber)
        }

        val players = playerRepository.findByGame(game).filter { it.isAlive }
        val total = players.size
        val currentVotes = players.count { it.votedFor != null }
        val required = (total / 2) + 1
        val votedPlayers = players.filter { it.votedFor != null }
        val pendingPlayers = players.filter { it.votedFor == null }

        return VotingStatusResponse(
            gameNumber = gameNumber,
            currentVotes = currentVotes,
            requiredVotes = required,
            totalPlayers = total,
            votedPlayers = votedPlayers.map { org.example.kotlin_liargame.domain.game.dto.response.PlayerVoteInfo(it.userId, it.nickname, null) },
            pendingPlayers = pendingPlayers.map { org.example.kotlin_liargame.domain.game.dto.response.PlayerVoteInfo(it.userId, it.nickname, null) },
            votingDeadline = game.phaseEndTime?.toString(),
            canChangeVote = true
        )
    }
}

