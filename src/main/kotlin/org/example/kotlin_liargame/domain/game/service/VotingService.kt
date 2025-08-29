package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.request.FinalVotingRequest
import org.example.kotlin_liargame.domain.game.dto.request.VoteRequest
import org.example.kotlin_liargame.domain.game.dto.response.FinalJudgmentResultResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.dto.response.VoteResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.global.config.GameProperties
import org.springframework.context.annotation.Lazy
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional
class VotingService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler,
    @Lazy private val defenseService: DefenseService,
    private val gameMonitoringService: GameMonitoringService,
    @Lazy private val gameResultService: GameResultService,
    private val gameProperties: GameProperties,
    @Lazy private val gameProgressService: GameProgressService,
    private val sessionService: org.example.kotlin_liargame.global.session.SessionService,
    @Lazy private val chatService: org.example.kotlin_liargame.domain.chat.service.ChatService
) {

    @Transactional
    fun startVotingPhase(game: GameEntity) {
        println("[VotingService] === STARTING VOTING PHASE ===")
        println("[VotingService] Game: ${game.gameNumber}, Current phase: ${game.currentPhase}")

        // 게임 페이즈와 시간 설정
        game.currentPhase = GamePhase.VOTING_FOR_LIAR
        game.phaseEndTime = Instant.now().plusSeconds(gameProperties.votingTimeSeconds)
        game.currentPlayerId = null // 투표 단계에서는 특정 플레이어 턴이 없음
        game.currentTurnIndex = game.turnOrder?.split(',')?.size ?: 0 // 모든 턴 완료 표시
        val savedGame = gameRepository.save(game)

        println("[VotingService] Game phase updated to: ${savedGame.currentPhase}")
        println("[VotingService] Phase end time: ${savedGame.phaseEndTime}")

        // 모든 플레이어 상태를 투표 대기로 변경
        val players = playerRepository.findByGame(savedGame)
        players.forEach { player ->
            if (player.isAlive) {
                player.state = PlayerState.WAITING_FOR_VOTE
                println("[VotingService] Player ${player.nickname} state changed to WAITING_FOR_VOTE")
            }
        }
        playerRepository.saveAll(players)

        // 투표 시작 시스템 메시지 전송
        try {
            chatService.sendSystemMessage(savedGame, "🗳️ 투표 단계가 시작되었습니다! 라이어라고 생각하는 플레이어에게 투표해주세요.")
            chatService.sendSystemMessage(savedGame, "⏰ ${gameProperties.votingTimeSeconds}초 안에 투표를 완료해주세요.")
            println("[VotingService] Voting start messages sent successfully")
        } catch (e: Exception) {
            println("[VotingService] ERROR: Could not send voting start messages: ${e.message}")
            e.printStackTrace()
        }

        // 게임 상태 브로드캐스트
        try {
            val gameStateResponse = getGameState(savedGame, null)
            println("[VotingService] === GAME STATE BROADCAST DEBUG ===")
            println("[VotingService] Broadcasting game state: phase=${gameStateResponse.currentPhase}, players=${gameStateResponse.players.size}")
            println("[VotingService] Game state details: gameNumber=${gameStateResponse.gameNumber}, gameState=${gameStateResponse.gameState}")
            println("[VotingService] Database game phase: ${savedGame.currentPhase}")
            println("[VotingService] Response currentPhase: ${gameStateResponse.currentPhase}")
            println("[VotingService] Players voting states:")
            gameStateResponse.players.forEach { player ->
                println("[VotingService]   - ${player.nickname}: hasVoted=${player.hasVoted}, isAlive=${player.isAlive}, state=${player.state}")
            }

            // 브로드캐스트 전에 한 번 더 확인
            println("[VotingService] About to broadcast to topic: /topic/game/${savedGame.gameNumber}/state")
            gameMonitoringService.broadcastGameState(savedGame, gameStateResponse)
            println("[VotingService] Game state broadcast successful")
            println("[VotingService] === GAME STATE BROADCAST COMPLETE ===")
        } catch (e: Exception) {
            println("[VotingService] ERROR: Failed to broadcast game state: ${e.message}")
            e.printStackTrace()
        }

        println("[VotingService] === VOTING PHASE STARTED SUCCESSFULLY ===")
    }


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
            processVoteResults(game)
        }
        
        return VoteResponse(
            voterNickname = voter.nickname,
            targetNickname = targetPlayer.nickname,
            success = true
        )
    }

    private fun processVoteResults(game: GameEntity) {
        // findByGameAndIsAlive 사용으로 성능 개선 및 코드 간소화
        val alivePlayers = playerRepository.findByGameAndIsAlive(game, true)
        val maxVotes = alivePlayers.maxOfOrNull { it.votesReceived } ?: 0

        if (maxVotes == 0) {
            // No votes cast, restart speech phase
            gameProgressService.restartSpeechPhase(game)
            return
        }

        val mostVotedPlayers = alivePlayers.filter { it.votesReceived == maxVotes }

        if (mostVotedPlayers.size > 1) {
            // Tie-breaker: revote by restarting speech phase
            gameProgressService.restartSpeechPhase(game)
        } else {
            // Single most-voted player
            val accusedPlayer = mostVotedPlayers.first()
            defenseService.startDefensePhase(game, accusedPlayer)
        }
    }

    @Transactional
    fun vote(req: VoteRequest, session: HttpSession): GameStateResponse {
        val userId = sessionService.getCurrentUserId(session)
        castVote(req.gameNumber, userId, req.targetPlayerId)
        return getGameState(gameRepository.findByGameNumber(req.gameNumber)!!, session)
    }

    @Transactional
    fun finalVote(req: FinalVotingRequest, session: HttpSession): GameStateResponse {
        val userId = sessionService.getCurrentUserId(session)
            ?: throw RuntimeException("Not authenticated")
        val game = gameRepository.findByGameNumberWithLock(req.gameNumber)
            ?: throw RuntimeException("Game not found")

        val voter = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")

        // 최종 투표는 변론이 끝난 플레이어들만 가능
        if (!voter.isAlive || voter.state != PlayerState.DEFENDED) {
            throw IllegalStateException("It's not the time for a final vote.")
        }

        voter.finalVote = req.voteForExecution
        voter.state = PlayerState.FINAL_VOTED
        playerRepository.save(voter)

        val players = playerRepository.findByGame(game)
        // findByGameAndIsAlive 사용으로 성능 개선 및 코드 간소화
        val alivePlayers = playerRepository.findByGameAndIsAlive(game, true)
        val allVoted = alivePlayers.none { it.state == PlayerState.DEFENDED }

        if (allVoted) {
            val accusedPlayer = players.find { it.state == PlayerState.ACCUSED || it.state == PlayerState.DEFENDED }
                ?: throw IllegalStateException("No accused player found.")

            val votesForExecution = alivePlayers.count { it.finalVote == true }
            val votesAgainstExecution = alivePlayers.count { it.finalVote == false }
            val isExecuted = votesForExecution > votesAgainstExecution

            val judgmentResult = FinalJudgmentResultResponse(
                gameNumber = game.gameNumber,
                accusedPlayerId = accusedPlayer.id,
                accusedPlayerNickname = accusedPlayer.nickname,
                isKilled = isExecuted,
                isLiar = accusedPlayer.role == PlayerRole.LIAR,
                executionVotes = votesForExecution,
                survivalVotes = votesAgainstExecution,
                totalVotes = alivePlayers.size
            )
            
            gameResultService.processGameResult(game.gameNumber, judgmentResult)
        }
        
        val gameStateResponse = getGameState(game, session)
        gameMonitoringService.broadcastGameState(game, gameStateResponse)
        return gameStateResponse
    }

    private fun getGameState(game: org.example.kotlin_liargame.domain.game.model.GameEntity, session: HttpSession?): GameStateResponse {
        val players = playerRepository.findByGame(game)
        val currentUserId = sessionService.getOptionalUserId(session)

        // turnOrder 정보 추가
        val turnOrder = game.turnOrder?.split(',')?.filter { it.isNotBlank() }
        val currentTurnIndex = game.currentTurnIndex

        return GameStateResponse.from(
            game = game,
            players = players,
            currentUserId = currentUserId,
            currentPhase = game.currentPhase, // 실제 게임의 currentPhase 사용
            turnOrder = turnOrder,
            currentTurnIndex = currentTurnIndex,
            phaseEndTime = game.phaseEndTime?.toString() // phaseEndTime 추가
        )
    }

    private fun getGameState(game: org.example.kotlin_liargame.domain.game.model.GameEntity, userId: Long): GameStateResponse {
        val players = playerRepository.findByGame(game)

        // turnOrder 정보 추가
        val turnOrder = game.turnOrder?.split(',')?.filter { it.isNotBlank() }
        val currentTurnIndex = game.currentTurnIndex

        return GameStateResponse.from(
            game = game,
            players = players,
            currentUserId = userId,
            currentPhase = game.currentPhase, // 실제 게임의 currentPhase 사용
            turnOrder = turnOrder,
            currentTurnIndex = currentTurnIndex,
            phaseEndTime = game.phaseEndTime?.toString() // phaseEndTime 추가
        )
    }
}
