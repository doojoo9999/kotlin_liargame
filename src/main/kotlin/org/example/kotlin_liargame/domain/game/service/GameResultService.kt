package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.model.GameHistorySummaryEntity
import org.example.kotlin_liargame.domain.game.model.enum.WinningTeam
import org.example.kotlin_liargame.domain.game.repository.GameHistorySummaryRepository
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
class GameResultService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val gameHistorySummaryRepository: GameHistorySummaryRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler,
    @Lazy private val topicGuessService: TopicGuessService,
    private val gameMonitoringService: GameMonitoringService,
    @Lazy private val chatService: org.example.kotlin_liargame.domain.chat.service.ChatService,
    @Lazy private val gameProgressService: GameProgressService,
    private val gameStateService: org.example.kotlin_liargame.global.redis.GameStateService
) {
    
    fun processGameResult(gameNumber: Int, judgmentResult: FinalJudgmentResultResponse) {
        when {
            // 라이어가 처형된 경우 -> 단어 추측 기회
            judgmentResult.isKilled && judgmentResult.isLiar -> {
                startLiarGuessPhase(gameNumber, judgmentResult.accusedPlayerId)
            }
            // 시민이 처형된 경우 -> 게임 종료 조건 확인
            judgmentResult.isKilled && !judgmentResult.isLiar -> {
                val endCondition = checkGameEndConditions(gameNumber)
                if (endCondition == GameEndCondition.NEXT_ROUND) {
                    startNextRound(gameNumber)
                } else {
                    endGameWithLiarVictory(gameNumber)
                }
            }
            // 처형되지 않은 경우 (과반수 실패) -> 다음 라운드
            !judgmentResult.isKilled -> {
                startNextRound(gameNumber)
            }
        }
    }
    
    fun startLiarGuessPhase(gameNumber: Int, liarPlayerId: Long): LiarGuessStartResponse {
        return topicGuessService.startLiarGuessPhase(gameNumber, liarPlayerId)
    }
    
    fun submitLiarGuess(gameNumber: Int, liarPlayerId: Long, guess: String): LiarGuessResultResponse {
        val response = topicGuessService.submitLiarGuess(gameNumber, liarPlayerId, guess)
        
        if (response.isCorrect) {
            endGameWithLiarVictory(gameNumber)
        } else {
            endGameWithCitizenVictory(gameNumber)
        }
        
        return response
    }
    
    fun endGameWithCitizenVictory(gameNumber: Int): GameEndResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val players = playerRepository.findByGame(game)
        
        // 시민 승리 시 "사망 표"를 던진 시민들에게 +1점 부여
        try {
            val finalVotingStatus = gameStateService.getFinalVotingStatus(gameNumber)
            if (finalVotingStatus.isNotEmpty()) {
                val finalVotingRecordMap = finalVotingStatus.mapValues { it.value ?: false }
                val awardedPlayers = gameProgressService.awardCitizenVictoryPoints(game, finalVotingRecordMap)
                println("[GameResultService] Awarded points to ${awardedPlayers.size} citizens for voting liar execution")
            }
        } catch (e: Exception) {
            println("[GameResultService] Failed to award citizen victory points: ${e.message}")
        }
        
        game.endGame()
        game.gameState = org.example.kotlin_liargame.domain.game.model.enum.GameState.ENDED
        gameRepository.save(game)
        
        recordGameHistory(game, players, WinningTeam.CITIZENS)

        sendModeratorMessage(gameNumber, "시민팀이 승리했습니다!")
        
        val gameStateResponse = GameStateResponse.from(
            game = game,
            players = players,
            currentUserId = null,
            currentPhase = org.example.kotlin_liargame.domain.game.model.enum.GamePhase.GAME_OVER,
            winner = "CITIZEN",
            reason = "라이어를 모두 찾아냈습니다."
        )
        gameMonitoringService.broadcastGameState(game, gameStateResponse)

        val citizens = players.filter { it.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.CITIZEN }
        val liars = players.filter { it.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR }

        val response = GameEndResponse(
            gameNumber = gameNumber,
            winner = "CITIZENS",
            citizens = citizens.map { PlayerResultInfo.from(it) },
            liars = liars.map { PlayerResultInfo.from(it) },
            citizenSubject = game.citizenSubject?.content,
            liarSubject = game.liarSubject?.content,
            gameStatistics = calculateGameStatistics(gameNumber)
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/game-end",
            response
        )
        
        topicGuessService.cleanupGuessStatus(gameNumber)
        
        return response
    }
    
    fun endGameWithLiarVictory(gameNumber: Int): GameEndResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val players = playerRepository.findByGame(game)
        
        // 라이어 승리 시 라이어에게 +2점 부여
        gameProgressService.awardLiarVictoryPoints(game, "단어 추측 정답으로 라이어 승리")
        
        game.endGame()
        game.gameState = org.example.kotlin_liargame.domain.game.model.enum.GameState.ENDED
        gameRepository.save(game)

        recordGameHistory(game, players, WinningTeam.LIARS)
        
        sendModeratorMessage(gameNumber, "라이어팀이 승리했습니다!")
        
        val gameStateResponse = GameStateResponse.from(
            game = game,
            players = players,
            currentUserId = null,
            currentPhase = org.example.kotlin_liargame.domain.game.model.enum.GamePhase.GAME_OVER,
            winner = "LIAR",
            reason = "라이어가 단어를 맞혔거나, 시민이 라이어를 모두 찾아내지 못했습니다."
        )
        gameMonitoringService.broadcastGameState(game, gameStateResponse)

        val citizens = players.filter { it.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.CITIZEN }
        val liars = players.filter { it.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR }

        val response = GameEndResponse(
            gameNumber = gameNumber,
            winner = "LIARS",
            citizens = citizens.map { PlayerResultInfo.from(it) },
            liars = liars.map { PlayerResultInfo.from(it) },
            citizenSubject = game.citizenSubject?.content,
            liarSubject = game.liarSubject?.content,
            gameStatistics = calculateGameStatistics(gameNumber)
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/game-end",
            response
        )
        
        topicGuessService.cleanupGuessStatus(gameNumber)
        
        return response
    }
    
    fun startNextRound(gameNumber: Int): NextRoundResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        
        val success = game.nextRound()
        if (!success) {
            endGameWithLiarVictory(gameNumber)
            throw IllegalStateException("Cannot proceed to next round")
        }
        
        gameRepository.save(game) // Save the incremented round number
        
        // Prepare the new round's state (roles, turns, etc.)
        gameProgressService.prepareNewRound(game)
        
        // Start the first turn of the new round
        gameProgressService.startNewTurn(game)

        val response = NextRoundResponse(
            gameNumber = gameNumber,
            currentRound = game.gameCurrentRound,
            totalRounds = game.gameTotalRounds,
            message = "라운드 ${game.gameCurrentRound}가 시작됩니다!"
        )
        
        sendModeratorMessage(gameNumber, response.message)
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/next-round",
            response
        )
        
        return response
    }
    
    private fun checkGameEndConditions(gameNumber: Int): GameEndCondition {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return GameEndCondition.CITIZEN_VICTORY
        val players = playerRepository.findByGame(game)
        
        // 먼저 점수 기반 승리 조건 확인
        val scoreBasedWinner = checkTargetPointsVictory(game, players)
        if (scoreBasedWinner != null) {
            return if (scoreBasedWinner.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR) {
                GameEndCondition.LIAR_VICTORY
            } else {
                GameEndCondition.CITIZEN_VICTORY
            }
        }
        
        val aliveLiars = players.filter { it.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR && it.isAlive }
        val aliveCitizens = players.filter { it.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.CITIZEN && it.isAlive }

        return when {
            aliveLiars.isEmpty() -> GameEndCondition.CITIZEN_VICTORY
            aliveCitizens.size <= aliveLiars.size -> GameEndCondition.LIAR_VICTORY
            game.gameCurrentRound >= game.gameTotalRounds -> GameEndCondition.LIAR_VICTORY  
            else -> GameEndCondition.NEXT_ROUND
        }
    }

    /**
     * 목표 점수 달성으로 인한 승리 조건 확인
     * @return 목표 점수에 도달한 플레이어, 없으면 null
     */
    fun checkTargetPointsVictory(gameNumber: Int): org.example.kotlin_liargame.domain.game.model.PlayerEntity? {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return null
        val players = playerRepository.findByGame(game)
        return checkTargetPointsVictory(game, players)
    }
    
    private fun checkTargetPointsVictory(
        game: org.example.kotlin_liargame.domain.game.model.GameEntity, 
        players: List<org.example.kotlin_liargame.domain.game.model.PlayerEntity>
    ): org.example.kotlin_liargame.domain.game.model.PlayerEntity? {
        return players.firstOrNull { it.cumulativeScore >= game.targetPoints }
    }

    /**
     * 실시간 점수판 브로드캐스트
     */
    fun broadcastScoreboard(gameNumber: Int) {
        try {
            val game = gameRepository.findByGameNumber(gameNumber) ?: return
            val players = playerRepository.findByGame(game)
            
            val scoreboard = players.map { player ->
                mapOf(
                    "playerId" to player.id,
                    "nickname" to player.nickname,
                    "role" to player.role.name,
                    "cumulativeScore" to player.cumulativeScore,
                    "isAlive" to player.isAlive
                )
            }.sortedByDescending { it["cumulativeScore"] as Int }
            
            val scoreboardData = mapOf(
                "gameNumber" to gameNumber,
                "targetPoints" to game.targetPoints,
                "players" to scoreboard,
                "timestamp" to Instant.now().toString()
            )
            
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/scoreboard",
                scoreboardData
            )
            
            println("[GameResultService] Scoreboard broadcasted for game $gameNumber")
        } catch (e: Exception) {
            println("[GameResultService] Failed to broadcast scoreboard: ${e.message}")
        }
    }

    /**
     * 점수 업데이트 후 승리 조건 확인 및 게임 종료 처리
     * @return 게임이 종료되었으면 true, 계속 진행하면 false
     */
    fun checkAndHandleScoreBasedVictory(gameNumber: Int): Boolean {
        val winner = checkTargetPointsVictory(gameNumber)
        if (winner != null) {
            sendModeratorMessage(
                gameNumber,
                "${winner.nickname}님이 ${winner.cumulativeScore}점으로 목표 점수 달성! 게임 종료!"
            )
            
            if (winner.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR) {
                endGameWithLiarVictory(gameNumber)
            } else {
                endGameWithCitizenVictory(gameNumber)
            }
            return true
        }
        return false
    }
    
    private fun calculateGameStatistics(gameNumber: Int): GameStatistics {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        
        val totalDuration = if (game.gameEndTime != null) {
            java.time.Duration.between(game.createdAt, game.gameEndTime).seconds
        } else 0L
        
        return GameStatistics(
            totalRounds = game.gameTotalRounds,
            currentRound = game.gameCurrentRound,
            totalDuration = totalDuration,
            averageRoundDuration = if (game.gameCurrentRound > 0) totalDuration / game.gameCurrentRound else 0L,
            totalVotes = 0,
            correctGuesses = 0
        )
    }
    
    private fun findLiarInGame(gameNumber: Int): org.example.kotlin_liargame.domain.game.model.PlayerEntity {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val players = playerRepository.findByGame(game)
        
        return players.firstOrNull { it.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR && it.isAlive }
            ?: throw IllegalStateException("No alive liar found in game")
    }
    
    private fun sendModeratorMessage(gameNumber: Int, message: String) {
        try {
            val game = gameRepository.findByGameNumber(gameNumber) ?: return
            chatService.sendSystemMessage(game, message)
        } catch (e: Exception) {
            // ChatService 호출 실패 시 WebSocket으로만 전송
            messagingTemplate.convertAndSend(
                "/topic/game/$gameNumber/moderator",
                mapOf(
                    "content" to message,
                    "timestamp" to Instant.now().toString(),
                    "type" to "MODERATOR_MESSAGE"
                )
            )
        }
    }

    private fun recordGameHistory(game: org.example.kotlin_liargame.domain.game.model.GameEntity, players: List<org.example.kotlin_liargame.domain.game.model.PlayerEntity>, winningTeam: WinningTeam) {
        try {
            val liar = players.firstOrNull { it.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR } ?: return

            val history = GameHistorySummaryEntity(
                gameNumber = game.gameNumber,
                gameMode = game.gameMode,
                participants = players.map { it.nickname }.toSet(),
                liarNickname = liar.nickname,
                winningTeam = winningTeam,
                gameRounds = game.gameCurrentRound
            )
            gameHistorySummaryRepository.save(history)
        } catch (e: Exception) {
            // 히스토리 저장 실패 시 로그만 남김
            println("[GameResultService] Failed to record game history: ${e.message}")
        }
    }
}
