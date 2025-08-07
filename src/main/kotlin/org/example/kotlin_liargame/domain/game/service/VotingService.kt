package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
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
    private val defenseService: DefenseService
) {
    
    // 투표 상태 관리
    private val gameVotingStatusMap = mutableMapOf<Int, MutableMap<Long, Long?>>() // gameNumber -> (voterPlayerId -> targetPlayerId)
    private val votingTimerMap = mutableMapOf<Int, Boolean>() // gameNumber -> isActive
    
    fun sendModeratorMessage(gameNumber: Int, message: String) {
        val moderatorMessage = ModeratorMessage(
            type = "MODERATOR",
            content = message,
            timestamp = Instant.now()
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/moderator",
            moderatorMessage
        )
    }
    
    fun startVoting(gameNumber: Int): VotingStartResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
            
        val players = playerRepository.findByGame(game)
        
        // 투표 상태 초기화
        gameVotingStatusMap[gameNumber] = players.associate { it.id to null }.toMutableMap()
        votingTimerMap[gameNumber] = true
        
        // 투표 가능한 플레이어 목록 전송 (자신 제외)
        val votingData = VotingStartMessage(
            gameNumber = gameNumber,
            availablePlayers = players.map { PlayerVotingInfo(it.id, it.nickname) },
            votingTimeLimit = 60, // 60초 투표 시간
            timestamp = Instant.now()
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/voting",
            votingData
        )
        
        // 투표 타이머 시작 (60초)
        startVotingTimer(gameNumber)
        
        return VotingStartResponse(
            gameNumber = gameNumber,
            players = players,
            votingTimeLimit = 60
        )
    }
    
    fun castVote(gameNumber: Int, voterPlayerId: Long, targetPlayerId: Long): VoteResponse {
        val votingStatus = gameVotingStatusMap[gameNumber]
            ?: throw IllegalStateException("Voting not started for this game")
            
        if (!votingTimerMap[gameNumber]!!) {
            throw IllegalStateException("Voting time has expired")
        }
        
        // 자신에게 투표 방지
        if (voterPlayerId == targetPlayerId) {
            throw IllegalArgumentException("Cannot vote for yourself")
        }
        
        // 투표 기록
        votingStatus[voterPlayerId] = targetPlayerId
        
        val voterPlayer = playerRepository.findById(voterPlayerId)
            .orElseThrow { IllegalArgumentException("Voter not found") }
        val targetPlayer = playerRepository.findById(targetPlayerId)
            .orElseThrow { IllegalArgumentException("Target player not found") }
        
        // 투표 현황 브로드캐스트
        broadcastVotingProgress(gameNumber)
        
        // 모든 플레이어가 투표했는지 확인
        if (checkAllPlayersVoted(gameNumber)) {
            processVotingResults(gameNumber)
        }
        
        return VoteResponse(
            voterNickname = voterPlayer.nickname,
            targetNickname = targetPlayer.nickname,
            success = true
        )
    }
    
    private fun startVotingTimer(gameNumber: Int) {
        taskScheduler.schedule({
            if (votingTimerMap[gameNumber] == true) {
                // 시간 종료 - 강제 투표 결과 처리
                votingTimerMap[gameNumber] = false
                processVotingResults(gameNumber)
            }
        }, Instant.now().plusSeconds(60))
    }
    
    private fun checkAllPlayersVoted(gameNumber: Int): Boolean {
        val votingStatus = gameVotingStatusMap[gameNumber] ?: return false
        return votingStatus.values.all { it != null }
    }
    
    private fun broadcastVotingProgress(gameNumber: Int) {
        val votingStatus = gameVotingStatusMap[gameNumber] ?: return
        val totalPlayers = votingStatus.size
        val votedPlayers = votingStatus.values.count { it != null }
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/voting-progress",
            VotingProgressMessage(
                gameNumber = gameNumber,
                votedCount = votedPlayers,
                totalCount = totalPlayers,
                timestamp = Instant.now()
            )
        )
    }
    
    fun processVotingResults(gameNumber: Int): VotingResultResponse {
        val votingStatus = gameVotingStatusMap[gameNumber]
            ?: throw IllegalStateException("No voting data found")
            
        votingTimerMap[gameNumber] = false
        
        // 투표 결과 집계
        val voteCountMap = mutableMapOf<Long, Int>()
        votingStatus.values.filterNotNull().forEach { targetId ->
            voteCountMap[targetId] = voteCountMap.getOrDefault(targetId, 0) + 1
        }
        
        // 최다 득표자 찾기
        val maxVotes = voteCountMap.values.maxOrNull() ?: 0
        val topVotedPlayers = voteCountMap.filter { it.value == maxVotes }.keys.toList()
        
        val resultMessage = when {
            topVotedPlayers.isEmpty() -> {
                // 아무도 투표받지 않음
                "아무도 투표받지 않았습니다. 다시 투표합니다."
            }
            topVotedPlayers.size == 1 -> {
                // 단독 최다 득표
                val accusedPlayer = playerRepository.findById(topVotedPlayers.first())
                    .orElseThrow { IllegalArgumentException("Player not found") }
                "${accusedPlayer.nickname}님이 가장 많은 표를 받았습니다."
            }
            else -> {
                // 동점 상황
                val tiedPlayerNames = topVotedPlayers.map { playerId ->
                    playerRepository.findById(playerId)
                        .orElseThrow { IllegalArgumentException("Player not found") }
                        .nickname
                }
                "동점입니다: ${tiedPlayerNames.joinToString(", ")}. 재투표를 진행합니다."
            }
        }
        
        // 투표 결과 발표
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        sendModeratorMessage(gameNumber, resultMessage)
        
        val response = VotingResultResponse(
            gameNumber = gameNumber,
            voteResults = voteCountMap,
            accusedPlayerId = if (topVotedPlayers.size == 1) topVotedPlayers.first() else null,
            isTie = topVotedPlayers.size > 1,
            needRevote = topVotedPlayers.isEmpty() || topVotedPlayers.size > 1
        )
        
        // 결과 브로드캐스트
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/voting-result",
            response
        )
        
        // 단독 최다 득표자가 있으면 변론 단계로 이동
        if (topVotedPlayers.size == 1) {
            scheduleDefensePhase(gameNumber, topVotedPlayers.first())
        } else {
            // 동점이거나 무투표면 재투표
            scheduleRevote(gameNumber)
        }
        
        return response
    }
    
    private fun scheduleDefensePhase(gameNumber: Int, accusedPlayerId: Long) {
        taskScheduler.schedule({
            // DefenseService를 통해 변론 단계 시작
            defenseService.startDefensePhase(gameNumber, accusedPlayerId)
            
            // 변론 단계로 변경
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/phase",
                GamePhaseMessage(
                    phase = "DEFENDING",
                    timestamp = Instant.now(),
                    additionalData = mapOf("accusedPlayerId" to accusedPlayerId)
                )
            )
        }, Instant.now().plusSeconds(3))
    }
    
    private fun scheduleRevote(gameNumber: Int) {
        taskScheduler.schedule({
            startVoting(gameNumber)
        }, Instant.now().plusSeconds(5))
    }
}