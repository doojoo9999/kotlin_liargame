package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.global.config.GameProperties
import org.example.kotlin_liargame.global.redis.DefenseStatus
import org.example.kotlin_liargame.global.redis.GameStateService
import org.springframework.context.annotation.Lazy
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledFuture
import kotlin.random.Random

@Service
@Transactional
class DefenseService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler,
    @Lazy private val gameResultService: GameResultService,
    private val gameProperties: GameProperties,
    private val gameStateService: GameStateService,
    private val gameMessagingService: org.example.kotlin_liargame.global.messaging.GameMessagingService
) {

    // ScheduledFuture는 직렬화가 어려우므로 로컬에서 관리
    private val scheduledTasksMap = ConcurrentHashMap<Int, MutableList<ScheduledFuture<*>>>()
    
    fun sendModeratorMessage(gameNumber: Int, message: String) {
        gameMessagingService.sendModeratorMessage(gameNumber, message)
    }
    
    fun startDefensePhase(game: GameEntity, accusedPlayer: PlayerEntity): DefenseStartResponse {
        game.currentPhase = GamePhase.DEFENDING
        game.accusedPlayerId = accusedPlayer.id
        game.phaseEndTime = Instant.now().plusSeconds(gameProperties.defenseTimeSeconds)
        gameRepository.save(game)

        accusedPlayer.state = PlayerState.ACCUSED
        playerRepository.save(accusedPlayer)

        // Redis에 상태 저장
        gameStateService.setDefenseStatus(game.gameNumber, DefenseStatus(accusedPlayerId = accusedPlayer.id))
        gameStateService.setDefenseTimer(game.gameNumber, true)

        val defenseStartMessage = DefenseStartMessage(
            gameNumber = game.gameNumber,
            accusedPlayerId = accusedPlayer.id,
            accusedPlayerNickname = accusedPlayer.nickname,
            defenseTimeLimit = gameProperties.defenseTimeSeconds.toInt(),
            timestamp = Instant.now()
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/${game.gameNumber}/defense-start",
            defenseStartMessage
        )
        
        sendModeratorMessage(
            game.gameNumber,
            "${accusedPlayer.nickname}님, ${gameProperties.defenseTimeSeconds}초 동안 변론해 주세요."
        )
        
        startDefenseTimer(game.gameNumber, gameProperties.defenseTimeSeconds)
        
        return DefenseStartResponse(
            gameNumber = game.gameNumber,
            accusedPlayerId = accusedPlayer.id,
            accusedPlayerNickname = accusedPlayer.nickname,
            defenseTimeLimit = gameProperties.defenseTimeSeconds.toInt(),
            success = true
        )
    }
    
    fun submitDefense(gameNumber: Int, playerId: Long, defenseText: String): DefenseSubmissionResponse {
        val defenseStatus = gameStateService.getDefenseStatus(gameNumber)
            ?: throw IllegalStateException("No defense phase active")
            
        if (defenseStatus.accusedPlayerId != playerId) {
            throw IllegalArgumentException("Only the accused player can submit defense")
        }
        
        if (defenseStatus.isDefenseSubmitted) {
            throw IllegalStateException("Defense already submitted")
        }
        
        if (!gameStateService.getDefenseTimer(gameNumber)) {
            throw IllegalStateException("Defense time has expired")
        }
        
        val player = playerRepository.findById(playerId)
            .orElseThrow { IllegalArgumentException("Player not found") }
        
        // Redis에 업데이트된 상태 저장
        gameStateService.setDefenseStatus(gameNumber, defenseStatus.copy(
            defenseText = defenseText,
            isDefenseSubmitted = true
        ))

        val submissionMessage = DefenseSubmissionMessage(
            gameNumber = gameNumber,
            playerId = playerId,
            playerNickname = player.nickname,
            defenseText = defenseText,
            timestamp = Instant.now()
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/defense-submission",
            submissionMessage
        )
        
        sendModeratorMessage(
            gameNumber,
            "${player.nickname}님이 변론을 완료했습니다."
        )
        
        scheduleFinalVoting(gameNumber)
        
        return DefenseSubmissionResponse(
            gameNumber = gameNumber,
            playerId = playerId,
            playerNickname = player.nickname,
            defenseText = defenseText,
            success = true
        )
    }
    
    private fun startDefenseTimer(gameNumber: Int, defenseTimeSeconds: Long) {
        val task = taskScheduler.schedule({
            if (gameStateService.getDefenseTimer(gameNumber)) {
                // 시간 종료 - 빈 변론으로 처리
                gameStateService.setDefenseTimer(gameNumber, false)
                handleDefenseTimeout(gameNumber)
            }
        }, Instant.now().plusSeconds(defenseTimeSeconds))
        
        addScheduledTask(gameNumber, task)
    }
    
    private fun handleDefenseTimeout(gameNumber: Int) {
        val defenseStatus = gameStateService.getDefenseStatus(gameNumber) ?: return

        if (!defenseStatus.isDefenseSubmitted) {
            val accusedPlayer = playerRepository.findById(defenseStatus.accusedPlayerId)
                .orElseThrow { IllegalArgumentException("Player not found") }
            
            gameStateService.setDefenseStatus(gameNumber, defenseStatus.copy(
                defenseText = "",
                isDefenseSubmitted = true
            ))

            sendModeratorMessage(
                gameNumber,
                "${accusedPlayer.nickname}님의 변론 시간이 종료되었습니다."
            )
            
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/defense-timeout",
                DefenseTimeoutMessage(
                    gameNumber = gameNumber,
                    accusedPlayerId = defenseStatus.accusedPlayerId,
                    accusedPlayerNickname = accusedPlayer.nickname,
                    timestamp = Instant.now()
                )
            )
            
            scheduleFinalVoting(gameNumber)
        }
    }
    
    private fun scheduleFinalVoting(gameNumber: Int) {
        val task = taskScheduler.schedule({
            startFinalVoting(gameNumber)
        }, Instant.now().plusSeconds(gameProperties.phaseTransitionDelaySeconds))

        addScheduledTask(gameNumber, task)
    }
    
    fun startFinalVoting(gameNumber: Int): FinalVotingStartResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
            
        game.currentPhase = GamePhase.VOTING_FOR_SURVIVAL
        game.phaseEndTime = Instant.now().plusSeconds(gameProperties.finalVotingTimeSeconds)
        gameRepository.save(game)

        val defenseStatus = gameStateService.getDefenseStatus(gameNumber)
            ?: throw IllegalStateException("No defense status found")
        
        val accusedPlayer = playerRepository.findById(defenseStatus.accusedPlayerId)
            .orElseThrow { IllegalArgumentException("Accused player not found") }
        
        val players = playerRepository.findByGame(game).filter { it.isAlive }
        players.forEach { player ->
            player.state = PlayerState.WAITING_FOR_FINAL_VOTE
        }
        playerRepository.saveAll(players)

        val votingStatus = mutableMapOf<Long, Boolean?>()
        players.forEach { player ->
            votingStatus[player.id] = null
        }
        
        gameStateService.setFinalVotingStatus(gameNumber, votingStatus)
        gameStateService.setFinalVotingTimer(gameNumber, true)

        val finalVotingMessage = FinalVotingStartMessage(
            gameNumber = gameNumber,
            accusedPlayerId = defenseStatus.accusedPlayerId,
            accusedPlayerNickname = accusedPlayer.nickname,
            defenseText = defenseStatus.defenseText ?: "",
            votingTimeLimit = gameProperties.finalVotingTimeSeconds.toInt(),
            timestamp = Instant.now()
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/final-voting-start",
            finalVotingMessage
        )
        
        sendModeratorMessage(
            gameNumber,
            "${accusedPlayer.nickname}님을 처형할지 투표해 주세요. (찬성/반대)"
        )
        
        startFinalVotingTimer(gameNumber, gameProperties.finalVotingTimeSeconds)
        
        return FinalVotingStartResponse(
            gameNumber = gameNumber,
            accusedPlayerId = defenseStatus.accusedPlayerId,
            accusedPlayerNickname = accusedPlayer.nickname,
            defenseText = defenseStatus.defenseText ?: "",
            votingTimeLimit = gameProperties.finalVotingTimeSeconds.toInt(),
            success = true
        )
    }
    
    fun castFinalVote(gameNumber: Int, voterPlayerId: Long, voteForExecution: Boolean): FinalVoteResponse {
        val votingStatus = gameStateService.getFinalVotingStatus(gameNumber)
            ?: throw IllegalStateException("No final voting active")
            
        if (!votingStatus.containsKey(voterPlayerId)) {
            throw IllegalArgumentException("Player not eligible to vote")
        }
        
        if (votingStatus[voterPlayerId] != null) {
            throw IllegalStateException("Player has already voted")
        }
        
        if (!gameStateService.getFinalVotingTimer(gameNumber)) {
            throw IllegalStateException("Final voting time has expired")
        }
        
        val voterPlayer = playerRepository.findById(voterPlayerId)
            .orElseThrow { IllegalArgumentException("Voter player not found") }

        votingStatus[voterPlayerId] = voteForExecution
        gameStateService.setFinalVotingStatus(gameNumber, votingStatus)

        broadcastFinalVotingProgress(gameNumber)
        
        if (checkAllPlayersFinalVoted(gameNumber)) {
            gameStateService.setFinalVotingTimer(gameNumber, false)
            processFinalVotingResults(gameNumber)
        }
        
        return FinalVoteResponse(
            gameNumber = gameNumber,
            voterPlayerId = voterPlayerId,
            voterNickname = voterPlayer.nickname,
            voteForExecution = voteForExecution,
            success = true
        )
    }
    
    private fun startFinalVotingTimer(gameNumber: Int, finalVotingTimeSeconds: Long) {
        val task = taskScheduler.schedule({
            if (gameStateService.getFinalVotingTimer(gameNumber)) {
                gameStateService.setFinalVotingTimer(gameNumber, false)
                handleFinalVotingTimeout(gameNumber)
            }
        }, Instant.now().plusSeconds(finalVotingTimeSeconds))
        
        addScheduledTask(gameNumber, task)
    }
    
    private fun handleFinalVotingTimeout(gameNumber: Int) {
        val votingStatus = gameStateService.getFinalVotingStatus(gameNumber) ?: return

        votingStatus.entries.filter { it.value == null }.forEach { entry ->
            val randomVote = Random.nextBoolean()
            votingStatus[entry.key] = randomVote
        }
        
        sendModeratorMessage(
            gameNumber,
            "최종 투표 시간이 종료되었습니다. 투표하지 않은 플레이어는 랜덤으로 처리됩니다."
        )
        
        processFinalVotingResults(gameNumber)
    }
    
    private fun checkAllPlayersFinalVoted(gameNumber: Int): Boolean {
        val votingStatus = gameStateService.getFinalVotingStatus(gameNumber) ?: return false
        return votingStatus.values.all { it != null }
    }
    
    private fun broadcastFinalVotingProgress(gameNumber: Int) {
        val votingStatus = gameStateService.getFinalVotingStatus(gameNumber) ?: return
        val totalPlayers = votingStatus.size
        val votedPlayers = votingStatus.values.count { it != null }
        
        gameMessagingService.sendProgressUpdate(gameNumber, votedPlayers, totalPlayers, "FINAL_VOTING")
    }
    
    fun processFinalVotingResults(gameNumber: Int): FinalVotingResultResponse {
        val votingStatus = gameStateService.getFinalVotingStatus(gameNumber)
            ?: throw IllegalStateException("No final voting data found")
            
        val defenseStatus = gameStateService.getDefenseStatus(gameNumber)
            ?: throw IllegalStateException("No defense status found")
        
        gameStateService.setFinalVotingTimer(gameNumber, false)

        val executionVotes = votingStatus.values.count { it == true }
        val survivalVotes = votingStatus.values.count { it == false }
        val totalVotes = votingStatus.size
        
        val isExecuted = executionVotes > survivalVotes
        
        val accusedPlayer = playerRepository.findById(defenseStatus.accusedPlayerId)
            .orElseThrow { IllegalArgumentException("Accused player not found") }
        
        val resultMessage = if (isExecuted) {
            "${accusedPlayer.nickname}님이 처형되었습니다. (찬성: $executionVotes, 반대: $survivalVotes)"
        } else {
            "${accusedPlayer.nickname}님이 생존했습니다. (찬성: $executionVotes, 반대: $survivalVotes)"
        }
        
        sendModeratorMessage(gameNumber, resultMessage)
        
        val response = FinalVotingResultResponse(
            gameNumber = gameNumber,
            accusedPlayerId = defenseStatus.accusedPlayerId,
            accusedPlayerNickname = accusedPlayer.nickname,
            executionVotes = executionVotes,
            survivalVotes = survivalVotes,
            totalVotes = totalVotes,
            isExecuted = isExecuted,
            defenseText = defenseStatus.defenseText ?: ""
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/final-voting-result",
            response
        )
        
        cleanupGameState(gameNumber)
        
        // Create FinalJudgmentResultResponse and call GameResultService
        val isLiar = accusedPlayer.role.name == "LIAR"
        val judgmentResult = FinalJudgmentResultResponse(
            gameNumber = gameNumber,
            accusedPlayerId = defenseStatus.accusedPlayerId,
            accusedPlayerNickname = accusedPlayer.nickname,
            isKilled = isExecuted,
            isLiar = isLiar,
            executionVotes = executionVotes,
            survivalVotes = survivalVotes,
            totalVotes = totalVotes
        )
        
        // Schedule GameResultService call after 3 seconds
        taskScheduler.schedule({
            gameResultService.processGameResult(gameNumber, judgmentResult)
        }, Instant.now().plusSeconds(3))
        
        return response
    }
    
    private fun addScheduledTask(gameNumber: Int, task: ScheduledFuture<*>) {
        scheduledTasksMap.computeIfAbsent(gameNumber) { mutableListOf() }.add(task)
    }

    fun cleanupGameState(gameNumber: Int) {
        // Redis 상태 정리는 GameStateService에 위임
        gameStateService.cleanupGameState(gameNumber)

        // 로컬 ScheduledFuture 정리
        scheduledTasksMap[gameNumber]?.forEach { task ->
            if (!task.isDone) {
                task.cancel(false)
            }
        }
        scheduledTasksMap.remove(gameNumber)
    }
    
    fun recoverGameState(gameNumber: Int): DefenseRecoveryResponse {
        val defenseStatus = gameStateService.getDefenseStatus(gameNumber)
        val finalVotingStatus = gameStateService.getFinalVotingStatus(gameNumber)

        return DefenseRecoveryResponse(
            gameNumber = gameNumber,
            hasActiveDefense = defenseStatus != null && !defenseStatus.isDefenseSubmitted,
            hasActiveFinalVoting = finalVotingStatus != null,
            accusedPlayerId = defenseStatus?.accusedPlayerId,
            defenseText = defenseStatus?.defenseText,
            isDefenseSubmitted = defenseStatus?.isDefenseSubmitted ?: false
        )
    }
}