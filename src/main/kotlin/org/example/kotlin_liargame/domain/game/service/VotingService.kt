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
import org.springframework.transaction.annotation.Propagation
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

    fun startVotingPhase(game: GameEntity) {
        // 1단계: 게임 상태 변경 (트랜잭션 내에서 완료 후 커밋)
        val savedGame = updateGameToVotingPhase(game)

        // 2단계: 메시지 전송 및 브로드캐스트 (새로운 트랜잭션에서 최신 데이터 조회)
        sendVotingMessages(savedGame.gameNumber)
    }

    @Transactional
    open fun updateGameToVotingPhase(game: GameEntity): GameEntity {
        println("[VotingService] === UPDATING GAME TO VOTING PHASE ===")
        println("[VotingService] Game: ${game.gameNumber}, Current phase: ${game.currentPhase}")

        // 게임 페이즈와 시간 설정
        game.currentPhase = GamePhase.VOTING_FOR_LIAR
        game.phaseEndTime = Instant.now().plusSeconds(gameProperties.votingTimeSeconds)
        game.currentPlayerId = null // 투표 단계에서는 특정 플레이어 턴이 없음
        game.currentTurnIndex = game.turnOrder?.split(',')?.size ?: 0 // 모든 턴 완료 표시
        game.accusedPlayerId = null // 회귀 시 이전 피고인 정보 초기화
        val savedGame = gameRepository.save(game)

        println("[VotingService] Game phase updated to: ${savedGame.currentPhase}")
        println("[VotingService] Phase end time: ${savedGame.phaseEndTime}")

        // 모든 플레이어 상태를 투표 대기로 변경 + 투표 이력 초기화 (회귀 대응)
        val players = playerRepository.findByGame(savedGame)
        players.forEach { player ->
            if (player.isAlive) {
                player.state = PlayerState.WAITING_FOR_VOTE
                player.votedFor = null // 이전 투표 리셋
                player.votesReceived = 0 // 받은 표수 리셋
                println("[VotingService] Player ${player.nickname} state changed to WAITING_FOR_VOTE, vote history reset")
            }
        }
        playerRepository.saveAll(players)

        println("[VotingService] === GAME STATE UPDATE COMPLETED ===")
        return savedGame
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    open fun sendVotingMessages(gameNumber: Int) {
        println("[VotingService] === SENDING VOTING MESSAGES ===")

        // 새로운 트랜잭션에서 최신 게임 상태 조회
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw RuntimeException("Game not found")

        println("[VotingService] Fresh game state loaded: phase=${game.currentPhase}")

        // 투표 시작 시스템 메시지 전송
        try {
            chatService.sendSystemMessage(game, "🗳️ 투표 단계가 시작되었습니다! 라이어라고 생각하는 플레이어에게 투표해주세요.")
            chatService.sendSystemMessage(game, "⏰ ${gameProperties.votingTimeSeconds}초 안에 투표를 완료해주세요.")
            println("[VotingService] Voting start messages sent successfully")
        } catch (e: Exception) {
            println("[VotingService] ERROR: Could not send voting start messages: ${e.message}")
            e.printStackTrace()
        }

        // 게임 상태 브로드캐스트 - 중복 제거
        try {
            val gameStateResponse = getGameState(game, null)
            println("[VotingService] === BROADCASTING GAME STATE ===")
            println("[VotingService] Game state: phase=${gameStateResponse.currentPhase}, playersCount=${gameStateResponse.players.size}")

            // 하나의 브로드캐스트 방식만 사용 (모니터링 서비스 통해 통합 관리)
            gameMonitoringService.broadcastGameState(game, gameStateResponse)
            println("[VotingService] Game state broadcast sent successfully")

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

        val targetPlayer = playerRepository.findByGameAndUserId(game, targetPlayerId)
            ?: throw RuntimeException("Target player not found")

        if (!targetPlayer.isAlive) {
            throw RuntimeException("Target player is eliminated from the game")
        }

        // 기존 투표 정보 제거 (재투표 시)
        voter.votedFor?.let { previousTargetUserId ->
            val previousTarget = playerRepository.findByGameAndUserId(game, previousTargetUserId)
            previousTarget?.let {
                it.votesReceived = maxOf(0, it.votesReceived - 1)
                playerRepository.save(it)
            }
        }

        // 새로운 투표 정보 설정
        voter.voteFor(targetPlayer.userId) // targetPlayer.id -> targetPlayer.userId로 변경
        voter.state = PlayerState.VOTED
        playerRepository.save(voter)

        targetPlayer.receiveVote()
        playerRepository.save(targetPlayer)

        println("[VotingService] Player ${voter.nickname} voted for ${targetPlayer.nickname}")

        gameMonitoringService.notifyPlayerVoted(gameNumber, voter.userId, targetPlayer.userId)

        // 투표 완료 조건 확인
        val players = playerRepository.findByGame(game)
        val alivePlayers = players.filter { it.isAlive }
        val votedPlayers = alivePlayers.filter { it.state == PlayerState.VOTED }

        println("[VotingService] Vote progress: ${votedPlayers.size}/${alivePlayers.size} players voted")

        if (votedPlayers.size >= alivePlayers.size) {
            println("[VotingService] All players have voted, processing vote results")
            processVoteResults(game)
        }
        
        return VoteResponse(
            voterNickname = voter.nickname,
            targetNickname = targetPlayer.nickname,
            success = true
        )
    }

    private fun processVoteResults(game: GameEntity) {
        println("[VotingService] === PROCESSING VOTE RESULTS ===")

        // findByGameAndIsAlive 사용으로 성능 개선 및 코드 간소화
        val alivePlayers = playerRepository.findByGameAndIsAlive(game, true)
        val maxVotes = alivePlayers.maxOfOrNull { it.votesReceived } ?: 0

        println("[VotingService] Max votes received: $maxVotes")
        alivePlayers.forEach { player ->
            println("[VotingService] Player ${player.nickname}: ${player.votesReceived} votes")
        }

        if (maxVotes == 0) {
            // 투표가 없었을 경우 - 랜덤으로 한 명 선택하여 변론 기회 제공
            println("[VotingService] No votes cast - randomly selecting a player for defense")
            val randomPlayer = alivePlayers.random()
            println("[VotingService] Randomly selected ${randomPlayer.nickname} for defense phase")
            defenseService.startDefensePhase(game, randomPlayer)
            return
        }

        val mostVotedPlayers = alivePlayers.filter { it.votesReceived == maxVotes }

        if (mostVotedPlayers.size > 1) {
            // 동점일 경우 - 랜덤으로 한 명 선택
            println("[VotingService] Tie detected between ${mostVotedPlayers.size} players")

            // 동점자 중 랜덤 선택
            val randomAccused = mostVotedPlayers.random()
            println("[VotingService] Randomly selected ${randomAccused.nickname} from tied players")
            defenseService.startDefensePhase(game, randomAccused)
        } else {
            // 단독 최다득표자
            val accusedPlayer = mostVotedPlayers.first()
            println("[VotingService] Single most-voted player: ${accusedPlayer.nickname}")
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
                // accusedPlayerId는 userId를 저장해야 함
                accusedPlayerId = accusedPlayer.userId,
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

    @Transactional
    fun forceVotingPhaseEnd(game: GameEntity) {
        println("[VotingService] === FORCING VOTING PHASE END ===")
        println("[VotingService] Game: ${game.gameNumber}, Current phase: ${game.currentPhase}")

        try {
            // 투표하지 않은 플레이어들의 상태를 VOTED로 변경 (빈 투표로 처리)
            val players = playerRepository.findByGame(game)
            val alivePlayers = players.filter { it.isAlive }
            val nonVotedPlayers = alivePlayers.filter { it.state == PlayerState.WAITING_FOR_VOTE }

            println("[VotingService] Non-voted players: ${nonVotedPlayers.size}")

            nonVotedPlayers.forEach { player ->
                player.state = PlayerState.VOTED
                println("[VotingService] Marking player ${player.nickname} as voted (timeout)")
            }
            playerRepository.saveAll(nonVotedPlayers)

            // 투표 결과 처리
            processVoteResults(game)

            // 시스템 메시지 전송
            chatService.sendSystemMessage(game, "⏰ 투표 시간이 만료되었습니다. 투표 결과를 집계합니다.")

            println("[VotingService] === VOTING PHASE END COMPLETED ===")
        } catch (e: Exception) {
            println("[VotingService] ERROR: Failed to force voting phase end: ${e.message}")
            e.printStackTrace()
            throw e
        }
    }
}
