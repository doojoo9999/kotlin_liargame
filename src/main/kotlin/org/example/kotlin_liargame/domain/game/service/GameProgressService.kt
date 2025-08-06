package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.CurrentTurnMessage
import org.example.kotlin_liargame.domain.game.dto.response.GameProgressResponse
import org.example.kotlin_liargame.domain.game.dto.response.ModeratorMessage
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional
class GameProgressService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {
    
    fun initializeGameProgress(gameNumber: Int): GameProgressResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
            
        // 플레이어 순서 랜덤 배치
        val players = playerRepository.findByGame(game).shuffled()
        
        // 첫 번째 플레이어를 현재 발언자로 설정
        val firstPlayer = players.first()
        
        // 사회자 메시지 전송
        sendModeratorMessage(gameNumber, "게임이 시작됩니다!")
        Thread.sleep(2000) // 2초 대기
        sendModeratorMessage(gameNumber, "${firstPlayer.nickname}님 발언하세요.")
        
        // 현재 턴 플레이어 설정
        setCurrentSpeaker(gameNumber, firstPlayer.id)
        
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
}