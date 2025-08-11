package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
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
    @Lazy private val gameResultService: GameResultService
) {

    private val gameDefenseStatusMap = ConcurrentHashMap<Int, DefenseStatus>()

    private val gameFinalVotingStatusMap = ConcurrentHashMap<Int, MutableMap<Long, Boolean?>>()

    private val defenseTimerMap = ConcurrentHashMap<Int, Boolean>()
    private val finalVotingTimerMap = ConcurrentHashMap<Int, Boolean>()
    private val scheduledTasksMap = ConcurrentHashMap<Int, MutableList<ScheduledFuture<*>>>()
    
    data class DefenseStatus(
        val accusedPlayerId: Long,
        val defenseText: String? = null,
        val isDefenseSubmitted: Boolean = false
    )
    
    fun sendModeratorMessage(gameNumber: Int, message: String) {
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/moderator",
            ModeratorMessage(
                content = message,
                timestamp = Instant.now()
            )
        )
    }
    
    fun startDefensePhase(gameNumber: Int, accusedPlayerId: Long): DefenseStartResponse {
        gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
            
        val accusedPlayer = playerRepository.findById(accusedPlayerId)
            .orElseThrow { IllegalArgumentException("Accused player not found") }
        
        gameDefenseStatusMap[gameNumber] = DefenseStatus(accusedPlayerId = accusedPlayerId)
        defenseTimerMap[gameNumber] = true
        
        val defenseStartMessage = DefenseStartMessage(
            gameNumber = gameNumber,
            accusedPlayerId = accusedPlayerId,
            accusedPlayerNickname = accusedPlayer.nickname,
            defenseTimeLimit = 60,
            timestamp = Instant.now()
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/defense-start",
            defenseStartMessage
        )
        
        sendModeratorMessage(
            gameNumber,
            "${accusedPlayer.nickname}님, 60초 동안 변론해 주세요."
        )
        
        startDefenseTimer(gameNumber)
        
        return DefenseStartResponse(
            gameNumber = gameNumber,
            accusedPlayerId = accusedPlayerId,
            accusedPlayerNickname = accusedPlayer.nickname,
            defenseTimeLimit = 60,
            success = true
        )
    }
    
    fun submitDefense(gameNumber: Int, playerId: Long, defenseText: String): DefenseSubmissionResponse {
        val defenseStatus = gameDefenseStatusMap[gameNumber]
            ?: throw IllegalStateException("No defense phase active")
            
        if (defenseStatus.accusedPlayerId != playerId) {
            throw IllegalArgumentException("Only the accused player can submit defense")
        }
        
        if (defenseStatus.isDefenseSubmitted) {
            throw IllegalStateException("Defense already submitted")
        }
        
        if (!defenseTimerMap[gameNumber]!!) {
            throw IllegalStateException("Defense time has expired")
        }
        
        val player = playerRepository.findById(playerId)
            .orElseThrow { IllegalArgumentException("Player not found") }
        
        gameDefenseStatusMap[gameNumber] = defenseStatus.copy(
            defenseText = defenseText,
            isDefenseSubmitted = true
        )
        
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
    
    private fun startDefenseTimer(gameNumber: Int) {
        val task = taskScheduler.schedule({
            if (defenseTimerMap[gameNumber] == true) {
                // 시간 종료 - 빈 변론으로 처리
                defenseTimerMap[gameNumber] = false
                handleDefenseTimeout(gameNumber)
            }
        }, Instant.now().plusSeconds(60))
        
        addScheduledTask(gameNumber, task)
    }
    
    private fun handleDefenseTimeout(gameNumber: Int) {
        val defenseStatus = gameDefenseStatusMap[gameNumber] ?: return
        
        if (!defenseStatus.isDefenseSubmitted) {
            val accusedPlayer = playerRepository.findById(defenseStatus.accusedPlayerId)
                .orElseThrow { IllegalArgumentException("Player not found") }
            
            gameDefenseStatusMap[gameNumber] = defenseStatus.copy(
                defenseText = "",
                isDefenseSubmitted = true
            )
            
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
        }, Instant.now().plusSeconds(3))
        
        addScheduledTask(gameNumber, task)
    }
    
    fun startFinalVoting(gameNumber: Int): FinalVotingStartResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
            
        val defenseStatus = gameDefenseStatusMap[gameNumber]
            ?: throw IllegalStateException("No defense status found")
        
        val accusedPlayer = playerRepository.findById(defenseStatus.accusedPlayerId)
            .orElseThrow { IllegalArgumentException("Accused player not found") }
        
        val players = playerRepository.findByGame(game).filter { it.isAlive }
        val votingStatus = mutableMapOf<Long, Boolean?>()
        players.forEach { player ->
            votingStatus[player.id] = null
        }
        
        gameFinalVotingStatusMap[gameNumber] = votingStatus
        finalVotingTimerMap[gameNumber] = true
        
        val finalVotingMessage = FinalVotingStartMessage(
            gameNumber = gameNumber,
            accusedPlayerId = defenseStatus.accusedPlayerId,
            accusedPlayerNickname = accusedPlayer.nickname,
            defenseText = defenseStatus.defenseText ?: "",
            votingTimeLimit = 30,
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
        
        startFinalVotingTimer(gameNumber)
        
        return FinalVotingStartResponse(
            gameNumber = gameNumber,
            accusedPlayerId = defenseStatus.accusedPlayerId,
            accusedPlayerNickname = accusedPlayer.nickname,
            defenseText = defenseStatus.defenseText ?: "",
            votingTimeLimit = 30,
            success = true
        )
    }
    
    fun castFinalVote(gameNumber: Int, voterPlayerId: Long, voteForExecution: Boolean): FinalVoteResponse {
        val votingStatus = gameFinalVotingStatusMap[gameNumber]
            ?: throw IllegalStateException("No final voting active")
            
        if (!votingStatus.containsKey(voterPlayerId)) {
            throw IllegalArgumentException("Player not eligible to vote")
        }
        
        if (votingStatus[voterPlayerId] != null) {
            throw IllegalStateException("Player has already voted")
        }
        
        if (!finalVotingTimerMap[gameNumber]!!) {
            throw IllegalStateException("Final voting time has expired")
        }
        
        val voterPlayer = playerRepository.findById(voterPlayerId)
            .orElseThrow { IllegalArgumentException("Voter not found") }
        
        votingStatus[voterPlayerId] = voteForExecution
        
        broadcastFinalVotingProgress(gameNumber)
        
        if (checkAllPlayersFinalVoted(gameNumber)) {
            finalVotingTimerMap[gameNumber] = false
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
    
    private fun startFinalVotingTimer(gameNumber: Int) {
        val task = taskScheduler.schedule({
            if (finalVotingTimerMap[gameNumber] == true) {
                finalVotingTimerMap[gameNumber] = false
                handleFinalVotingTimeout(gameNumber)
            }
        }, Instant.now().plusSeconds(30))
        
        addScheduledTask(gameNumber, task)
    }
    
    private fun handleFinalVotingTimeout(gameNumber: Int) {
        val votingStatus = gameFinalVotingStatusMap[gameNumber] ?: return
        
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
        val votingStatus = gameFinalVotingStatusMap[gameNumber] ?: return false
        return votingStatus.values.all { it != null }
    }
    
    private fun broadcastFinalVotingProgress(gameNumber: Int) {
        val votingStatus = gameFinalVotingStatusMap[gameNumber] ?: return
        val totalPlayers = votingStatus.size
        val votedPlayers = votingStatus.values.count { it != null }
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/final-voting-progress",
            FinalVotingProgressMessage(
                gameNumber = gameNumber,
                votedCount = votedPlayers,
                totalCount = totalPlayers,
                timestamp = Instant.now()
            )
        )
    }
    
    fun processFinalVotingResults(gameNumber: Int): FinalVotingResultResponse {
        val votingStatus = gameFinalVotingStatusMap[gameNumber]
            ?: throw IllegalStateException("No final voting data found")
            
        val defenseStatus = gameDefenseStatusMap[gameNumber]
            ?: throw IllegalStateException("No defense status found")
        
        finalVotingTimerMap[gameNumber] = false
        
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
        gameDefenseStatusMap.remove(gameNumber)
        gameFinalVotingStatusMap.remove(gameNumber)
        defenseTimerMap.remove(gameNumber)
        finalVotingTimerMap.remove(gameNumber)
        
        scheduledTasksMap[gameNumber]?.forEach { task ->
            if (!task.isDone) {
                task.cancel(false)
            }
        }
        scheduledTasksMap.remove(gameNumber)
    }
    
    fun recoverGameState(gameNumber: Int): DefenseRecoveryResponse {
        val defenseStatus = gameDefenseStatusMap[gameNumber]
        val finalVotingStatus = gameFinalVotingStatusMap[gameNumber]
        
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