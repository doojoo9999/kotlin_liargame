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

@Service
@Transactional
class GameProgressService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler,
    @Lazy private val votingService: VotingService
) {
    
    // 플레이어 순서 및 상태 관리
    private val gamePlayerOrderMap = mutableMapOf<Int, List<Long>>() // gameNumber -> playerIds
    private val currentTurnIndexMap = mutableMapOf<Int, Int>() // gameNumber -> currentIndex
    private val playerSpeechStatusMap = mutableMapOf<Int, MutableMap<Long, Boolean>>() // gameNumber -> (playerId -> hasSpoken)
    
    fun initializeGameProgress(gameNumber: Int): GameProgressResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
            
        // 플레이어 순서 랜덤 배치
        val players = playerRepository.findByGame(game).shuffled()
        
        // 플레이어 순서 저장
        gamePlayerOrderMap[gameNumber] = players.map { it.id }
        currentTurnIndexMap[gameNumber] = 0
        playerSpeechStatusMap[gameNumber] = mutableMapOf()
        
        // 첫 번째 플레이어를 현재 발언자로 설정
        val firstPlayer = players.first()
        
        // 사회자 메시지 전송
        sendModeratorMessage(gameNumber, "게임이 시작됩니다!")
        Thread.sleep(2000) // 2초 대기
        sendModeratorMessage(gameNumber, "${firstPlayer.nickname}님 발언하세요.")
        
        // 현재 턴 플레이어 설정
        setCurrentSpeaker(gameNumber, firstPlayer.id)
        
        // 발언 타이머 시작 (60초)
        startSpeechTimer(gameNumber, firstPlayer.id)
        
        return GameProgressResponse(
            gameId = gameNumber.toLong(),
            currentSpeaker = firstPlayer,
            playerOrder = players,
            phase = "SPEAKING"
        )
    }
    
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
    
    fun setCurrentSpeaker(gameNumber: Int, playerId: Long) {
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/turn",
            CurrentTurnMessage(
                currentSpeakerId = playerId,
                timestamp = Instant.now()
            )
        )
    }
    
    fun moveToNextPlayer(gameNumber: Int): NextPlayerResponse {
        val currentIndex = currentTurnIndexMap[gameNumber] ?: 0
        val playerOrder = gamePlayerOrderMap[gameNumber] 
            ?: throw IllegalStateException("Game not initialized")
            
        val nextIndex = currentIndex + 1
        
        // 모든 플레이어가 발언했는지 확인
        if (nextIndex >= playerOrder.size) {
            return startVotingPhase(gameNumber)
        }
        
        // 다음 플레이어로 턴 이동
        currentTurnIndexMap[gameNumber] = nextIndex
        val nextPlayerId = playerOrder[nextIndex]
        val nextPlayer = playerRepository.findById(nextPlayerId)
            .orElseThrow { IllegalArgumentException("Player not found") }
        
        // 사회자 메시지 전송
        sendModeratorMessage(gameNumber, "${nextPlayer.nickname}님 발언하세요.")
        setCurrentSpeaker(gameNumber, nextPlayerId)
        
        // 발언 타이머 시작 (60초)
        startSpeechTimer(gameNumber, nextPlayerId)
        
        return NextPlayerResponse(
            gameId = gameNumber.toLong(),
            currentSpeaker = nextPlayer,
            remainingPlayers = playerOrder.size - nextIndex - 1,
            phase = "SPEAKING"
        )
    }
    
    fun markPlayerAsSpoken(gameNumber: Int, playerId: Long) {
        val speechStatus = playerSpeechStatusMap.getOrPut(gameNumber) { mutableMapOf() }
        speechStatus[playerId] = true
        
        // 발언 완료 메시지
        val player = playerRepository.findById(playerId)
            .orElseThrow { IllegalArgumentException("Player not found") }
            
        sendModeratorMessage(gameNumber, "${player.nickname}님이 발언을 완료했습니다.")
        
        // 2초 후 다음 플레이어로 이동
        taskScheduler.schedule({
            moveToNextPlayer(gameNumber)
        }, Instant.now().plusSeconds(2))
    }
    
    private fun startSpeechTimer(gameNumber: Int, playerId: Long) {
        // 60초 후 자동으로 다음 플레이어로 넘김
        taskScheduler.schedule({
            val speechStatus = playerSpeechStatusMap[gameNumber]
            if (speechStatus?.get(playerId) != true) {
                // 플레이어가 발언하지 않았으면 자동으로 넘김
                val player = playerRepository.findById(playerId)
                    .orElseThrow { IllegalArgumentException("Player not found") }
                    
                sendModeratorMessage(gameNumber, "${player.nickname}님의 발언 시간이 종료되었습니다.")
                markPlayerAsSpoken(gameNumber, playerId)
            }
        }, Instant.now().plusSeconds(60))
    }
    
    private fun startVotingPhase(gameNumber: Int): NextPlayerResponse {
        sendModeratorMessage(gameNumber, "모든 플레이어의 발언이 끝났습니다.")
        
        // 2초 후 투표 시작
        taskScheduler.schedule({
            sendModeratorMessage(gameNumber, "투표 시간입니다. 라이어를 지목해 주세요.")
            
            // 투표 상태로 변경
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/phase",
                GamePhaseMessage(
                    phase = "VOTING",
                    timestamp = Instant.now()
                )
            )
            
            // 실제 투표 시작
            votingService.startVoting(gameNumber)
        }, Instant.now().plusSeconds(2))
        
        return NextPlayerResponse(
            gameId = gameNumber.toLong(),
            currentSpeaker = null,
            remainingPlayers = 0,
            phase = "VOTING"
        )
    }
}