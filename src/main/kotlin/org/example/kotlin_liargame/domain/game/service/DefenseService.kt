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
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ScheduledFuture
import kotlin.random.Random

@Service
class DefenseService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val messagingTemplate: SimpMessagingTemplate,
    private val taskScheduler: TaskScheduler,
    @Lazy private val gameResultService: GameResultService,
    private val gameProperties: GameProperties,
    private val gameStateService: GameStateService,
    private val gameMessagingService: org.example.kotlin_liargame.global.messaging.GameMessagingService,
    @Lazy private val votingService: VotingService,
    @Lazy private val gameProgressService: GameProgressService
) {

    // ScheduledFuture는 직렬화가 어려우므로 로컬에서 관리
    private val scheduledTasksMap = ConcurrentHashMap<Int, MutableList<ScheduledFuture<*>>>()
    
    fun sendModeratorMessage(gameNumber: Int, message: String) {
        gameMessagingService.sendModeratorMessage(gameNumber, message)
    }
    
    fun startDefensePhase(game: GameEntity, accusedPlayer: PlayerEntity): DefenseStartResponse {
        game.currentPhase = GamePhase.DEFENDING
        // accusedPlayerId는 userId를 저장해야 함
        game.accusedPlayerId = accusedPlayer.userId
        game.phaseEndTime = Instant.now().plusSeconds(gameProperties.defenseTimeSeconds)
        gameRepository.save(game)

        accusedPlayer.state = PlayerState.ACCUSED
        playerRepository.save(accusedPlayer)

        // Redis에 상태 저장 - DB와 일관성 유지를 위해 userId 사용
        gameStateService.setDefenseStatus(game.gameNumber, DefenseStatus(accusedPlayerId = accusedPlayer.userId))
        gameStateService.setDefenseTimer(game.gameNumber, true)

        val defenseStartMessage = DefenseStartMessage(
            gameNumber = game.gameNumber,
            accusedPlayerId = accusedPlayer.userId,
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
        
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val player = playerRepository.findByGameAndUserId(game, playerId)
            ?: throw IllegalArgumentException("Player not found")

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
    
    fun endDefense(gameNumber: Int, playerId: Long): GameStateResponse {
        println("[DEBUG] DefenseService.endDefense called - gameNumber: $gameNumber, playerId: $playerId")

        // 1. 권한/페이즈 검증 - DEFENDING 페이즈에서만 허용
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
            
        println("[DEBUG] Game found - currentPhase: ${game.currentPhase}")

        if (game.currentPhase != GamePhase.DEFENDING) {
            throw IllegalStateException("Defense can only be ended during DEFENDING phase")
        }
        
        val defenseStatus = gameStateService.getDefenseStatus(gameNumber)
        println("[DEBUG] DefenseStatus: $defenseStatus")

        if (defenseStatus == null) {
            throw IllegalStateException("No defense phase active")
        }

        if (defenseStatus.accusedPlayerId != playerId) {
            println("[ERROR] Player $playerId is not the accused player ${defenseStatus.accusedPlayerId}")
            throw IllegalArgumentException("Only the accused player can end defense")
        }
        
        // 2. 경합 방지/단일 전환 - 이미 종료되었는지 확인
        if (defenseStatus.isDefenseSubmitted) {
            println("[DEBUG] Defense already submitted - returning current state")
            val players = playerRepository.findByGame(game)
            val accusedPlayer = players.find { it.userId == playerId }

            // finalVotingRecord 조회 (있을 경우)
            val finalVotingStatus = gameStateService.getFinalVotingStatus(gameNumber)
            val finalVotingRecord = finalVotingStatus?.map { (playerId, voteForExecution) ->
                val player = players.find { it.userId == playerId }
                mapOf(
                    "voterPlayerId" to playerId,
                    "voterNickname" to (player?.nickname ?: "Unknown"),
                    "voteForExecution" to (voteForExecution ?: false)
                )
            }
            
            return GameStateResponse.from(
                game = game,
                players = players,
                currentUserId = playerId,
                currentPhase = game.currentPhase,
                accusedPlayer = accusedPlayer,
                phaseEndTime = game.phaseEndTime?.toString(),
                finalVotingRecord = finalVotingRecord
            )
        }
        
        println("[DEBUG] Proceeding with defense end process")

        // 기존 defense timer 취소
        gameStateService.setDefenseTimer(gameNumber, false)
        cleanupGameState(gameNumber)
        
        val player = playerRepository.findById(playerId)
            .orElseThrow { IllegalArgumentException("Player not found") }

        println("[DEBUG] Player found: ${player.nickname}")

        // 변론을 즉시 종료하고 final voting으로 전환
        val finalDefenseText = defenseStatus.defenseText ?: ""
        gameStateService.setDefenseStatus(gameNumber, defenseStatus.copy(
            defenseText = finalDefenseText,
            isDefenseSubmitted = true
        ))

        sendModeratorMessage(
            gameNumber,
            "${player.nickname}님이 변론을 조기 종료했습니다."
        )
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/defense-ended",
            DefenseSubmissionMessage(
                gameNumber = gameNumber,
                playerId = playerId,
                playerNickname = player.nickname,
                defenseText = finalDefenseText,
                timestamp = Instant.now()
            )
        )
        
        println("[DEBUG] Starting final voting")

        // 즉시 final voting 시작 (딜레이 없음)
        startFinalVoting(gameNumber)
        
        // 3. 브로드캐스트/복구 일관화 - 전환된 게임 상태로 업데이트된 정보 반환
        val updatedGame = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val players = playerRepository.findByGame(updatedGame)
        val accusedPlayer = players.find { it.id == playerId }

        println("[DEBUG] Defense end completed successfully - new phase: ${updatedGame.currentPhase}")

        return GameStateResponse.from(
            game = updatedGame, 
            players = players, 
            currentUserId = playerId,
            currentPhase = updatedGame.currentPhase, // VOTING_FOR_SURVIVAL로 전환됨
            accusedPlayer = accusedPlayer,
            phaseEndTime = updatedGame.phaseEndTime?.toString(),
            finalVotingRecord = null // final voting이 막 시작되어 아직 기록 없음
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
            
        // 멱등성 보장 - 이미 VOTING_FOR_SURVIVAL 단계면 중복 실행 방지
        if (game.currentPhase == GamePhase.VOTING_FOR_SURVIVAL) {
            // 이미 최종 투표가 시작된 경우, 기존 상태 반환
            val defenseStatus = gameStateService.getDefenseStatus(gameNumber)
                ?: throw IllegalStateException("No defense status found")
            val accusedPlayer = playerRepository.findById(defenseStatus.accusedPlayerId)
                .orElseThrow { IllegalArgumentException("Accused player not found") }

            return FinalVotingStartResponse(
                gameNumber = gameNumber,
                accusedPlayerId = defenseStatus.accusedPlayerId,
                accusedPlayerNickname = accusedPlayer.nickname,
                defenseText = defenseStatus.defenseText ?: "",
                votingTimeLimit = gameProperties.finalVotingTimeSeconds.toInt(),
                success = true
            )
        }
            
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
        
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        val voterPlayer = playerRepository.findByGameAndUserId(game, voterPlayerId)
            ?: throw IllegalArgumentException("Voter player not found")

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
        // 1. 멱등성 보장을 위한 락 획득
        if (!gameStateService.acquireFinalVotingProcessLock(gameNumber)) {
            throw IllegalStateException("Final voting result processing is already in progress or completed")
        }
        
        // 2. 권한/페이즈 검증 - DEFENDING 또는 VOTING_FOR_SURVIVAL 페이즈에서만 허용
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found")
        
        if (game.currentPhase != GamePhase.DEFENDING && game.currentPhase != GamePhase.VOTING_FOR_SURVIVAL) {
            gameStateService.releaseFinalVotingProcessLock(gameNumber)
            throw IllegalStateException("Final voting can only be processed during DEFENDING or VOTING_FOR_SURVIVAL phase")
        }
        
        val votingStatus = gameStateService.getFinalVotingStatus(gameNumber)
            ?: throw IllegalStateException("No final voting data found")
            
        val defenseStatus = gameStateService.getDefenseStatus(gameNumber)
            ?: throw IllegalStateException("No defense status found")
        
        gameStateService.setFinalVotingTimer(gameNumber, false)

        val executionVotes = votingStatus.values.count { it == true }
        val survivalVotes = votingStatus.values.count { it == false }
        val totalVotes = votingStatus.size
        
        // 최종 투표 판정 로직을 별도 메서드로 분리하여 테스트 가능하게 구현
        val isExecuted = calculateFinalVotingResult(executionVotes, survivalVotes, totalVotes)

        val accusedPlayer = playerRepository.findById(defenseStatus.accusedPlayerId)
            .orElseThrow { IllegalArgumentException("Accused player not found") }

        // finalVotingRecord 스냅샷 생성 (요구사항) - game 변수는 이미 위에서 선언됨
        val players = playerRepository.findByGame(game)
        val finalVotingRecord = votingStatus.map { (playerId, voteForExecution) ->
            val player = players.find { it.id == playerId }
            mapOf(
                "voterPlayerId" to playerId,
                "voterNickname" to (player?.nickname ?: "Unknown"),
                "voteForExecution" to (voteForExecution ?: false)
            )
        }
        
        val resultMessage = if (isExecuted) {
            "${accusedPlayer.nickname}님이 처형되었습니다. (찬성: $executionVotes, 반대: $survivalVotes)"
        } else {
            "${accusedPlayer.nickname}님이 생존했습니다. (찬성: $executionVotes, 반대: $survivalVotes)"
        }
        
        sendModeratorMessage(gameNumber, resultMessage)
        
        // 점수 계산 및 부여 - GameProgressService 통합
        var scoreUpdated = false
        if (isExecuted && accusedPlayer.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR) {
            // 라이어가 처형된 경우: "사망 표"를 던진 시민들에게 +1점
            val finalVotingRecordMap = votingStatus.mapValues { it.value ?: false }
            val awardedPlayers = gameProgressService.awardCitizenVictoryPoints(game, finalVotingRecordMap)
            println("[DefenseService] Awarded points to ${awardedPlayers.size} citizens for voting liar execution")
            scoreUpdated = awardedPlayers.isNotEmpty()
            
        } else if (!isExecuted && accusedPlayer.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR) {
            // 라이어가 생존한 경우: 라이어에게 +2점
            val winnerPlayer = gameProgressService.awardLiarVictoryPoints(game, "시민 오판으로 라이어 생존")
            if (winnerPlayer != null) {
                scoreUpdated = true
            }

        } else if (isExecuted && accusedPlayer.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.CITIZEN) {
            // 시민이 처형된 경우: 라이어에게 +2점
            val winnerPlayer = gameProgressService.awardLiarVictoryPoints(game, "시민 처형으로 라이어 승리")
            if (winnerPlayer != null) {
                scoreUpdated = true
            }
        }
        
        // Get updated game and players data after potential scoring
        val updatedGame = gameRepository.findByGameNumber(gameNumber) 
            ?: throw IllegalArgumentException("Game not found")
        val updatedPlayers = playerRepository.findByGame(updatedGame)
        
        val response = FinalVotingResultResponse(
            gameNumber = gameNumber,
            accusedPlayerId = defenseStatus.accusedPlayerId,
            accusedPlayerNickname = accusedPlayer.nickname,
            executionVotes = executionVotes,
            survivalVotes = survivalVotes,
            totalVotes = totalVotes,
            isExecuted = isExecuted,
            defenseText = defenseStatus.defenseText ?: "",
            finalVotingRecord = finalVotingRecord,
            scoreboard = updatedPlayers.map { org.example.kotlin_liargame.domain.game.dto.response.ScoreboardEntry.from(it) },
            targetPoints = updatedGame.targetPoints
        )
        
        // 점수 업데이트 후 실시간 점수판 브로드캐스트 및 승리 조건 확인
        if (scoreUpdated) {
            gameResultService.broadcastScoreboard(gameNumber)
            
            // 목표 점수 달성 시 즉시 게임 종료
            if (gameResultService.checkAndHandleScoreBasedVictory(gameNumber)) {
                return response // 게임이 종료되었으므로 즉시 반환
            }
        }
        
        messagingTemplate.convertAndSend(
            "/topic/game/$gameNumber/final-voting-result",
            response
        )
        
        cleanupGameState(gameNumber)
        
        if (isExecuted) {
            // 처형된 경우: 변론자 제거 및 역할에 따른 단계 분기
            accusedPlayer.isAlive = false
            playerRepository.save(accusedPlayer)
            
            val isLiar = accusedPlayer.role == org.example.kotlin_liargame.domain.game.model.enum.PlayerRole.LIAR
            
            if (isLiar) {
                // 변론자가 라이어면: GUESSING_WORD 단계로 전환
                game.currentPhase = GamePhase.GUESSING_WORD
                game.phaseEndTime = Instant.now().plusSeconds(gameProperties.topicGuessTimeSeconds.toLong())
                gameRepository.save(game)
                
                // 업데이트된 게임 상태 브로드캐스트
                gameMessagingService.broadcastGameState(game.gameNumber, game.gameState.name)
                
                sendModeratorMessage(
                    gameNumber,
                    "라이어가 처형되었습니다. 라이어는 주제를 맞춰보세요!"
                )

                // 득점 훅: Step 4에서 처리할 수 있도록 명확한 지점 표시
                val finalVotingRecordMap = votingStatus.mapValues { it.value ?: false }
                val awardedCitizens = gameProgressService.awardCitizenVictoryPoints(game, finalVotingRecordMap)
                println("[DefenseService] Awarded points to ${awardedCitizens.size} citizens for executing the liar.")
                
            } else {
                // 변론자가 시민이면: 라이어 승리로 즉시 종료
                sendModeratorMessage(
                    gameNumber,
                    "시민이 처형되었습니다. 라이어가 승리했습니다!"
                )
                
                // 득점 훅: Step 4에서 처리할 수 있도록 명확한 지점 표시
                val awardedLiar = gameProgressService.awardLiarVictoryPoints(game, "시민 처형으로 라이어 승리")
                if (awardedLiar != null) {
                    println("[DefenseService] Awarded points to liar ${awardedLiar.nickname} for citizen execution.")
                }
                
                // 게임 즉시 종료 처리 (라이어 승리)
                taskScheduler.schedule({
                    gameResultService.processGameResult(gameNumber, FinalJudgmentResultResponse(
                        gameNumber = gameNumber,
                        accusedPlayerId = defenseStatus.accusedPlayerId,
                        accusedPlayerNickname = accusedPlayer.nickname,
                        isKilled = isExecuted,
                        isLiar = isLiar,
                        executionVotes = executionVotes,
                        survivalVotes = survivalVotes,
                        totalVotes = totalVotes
                    ))
                }, Instant.now().plusSeconds(3))
            }
        } else {
            // 생존한 경우: VOTING_FOR_LIAR 단계로 회귀
            val gameAfterVoting = gameRepository.findByGameNumber(gameNumber)
                ?: throw IllegalArgumentException("Game not found")
            val playersAfterVoting = playerRepository.findByGame(gameAfterVoting)

            // 이전 피고인 정보 및 투표 이력 리셋
            gameAfterVoting.accusedPlayerId = null
            gameRepository.save(gameAfterVoting)

            playersAfterVoting.forEach { player ->
                if (player.isAlive) {
                    player.votedFor = null // 이전 투표 리셋
                    player.votesReceived = 0
                }
            }
            playerRepository.saveAll(playersAfterVoting)

            sendModeratorMessage(
                gameNumber,
                "${accusedPlayer.nickname}님이 생존했습니다. 다시 라이어 지목 투표를 진행합니다."
            )

            // VotingService를 통해 투표 단계 시작 (타이머 및 상태 설정 포함)
            // 이는 게임 상태, 플레이어 상태, 타이머 설정을 모두 처리합니다
            votingService.startVotingPhase(gameAfterVoting)
        }
        
        // 3. 락 해제
        gameStateService.releaseFinalVotingProcessLock(gameNumber)
        
        return response
    }
    
    /**
     * 최종 투표 결과를 계산하는 순수 함수 (테스트 가능)
     *
     * 최종 투표 규칙 (요구사항에 따른 정확한 구현):
     * - 사망표 과반: votesForExecution > floor(alive/2) → 처형
     * - 정확히 절반(짝수에서만): votesForExecution == votesAgainstExecution → 생존
     * - 생존표 과반: votesAgainstExecution > floor(alive/2) → 생존
     *
     * @param executionVotes 사망표 수
     * @param survivalVotes 생존표 수
     * @param totalVotes 전체 투표 수
     * @return 처형 여부
     */
    private fun calculateFinalVotingResult(executionVotes: Int, survivalVotes: Int, totalVotes: Int): Boolean {
        val majorityThreshold = totalVotes / 2 // floor(alive/2)
        return when {
            executionVotes > majorityThreshold -> true  // 사망표 과반 → 처형
            executionVotes == survivalVotes -> false    // 정확히 절반 → 생존
            survivalVotes > majorityThreshold -> false  // 생존표 과반 → 생존
            else -> executionVotes > survivalVotes       // 기본: 더 많은 표
        }
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

        // 게임 및 플레이어 정보 조회
        val game = gameRepository.findByGameNumber(gameNumber)
        val players = game?.let { playerRepository.findByGame(it) } ?: emptyList()

        // 피고인 정보 조회
        val accusedPlayer = defenseStatus?.accusedPlayerId?.let { playerId ->
            players.find { it.id == playerId }
        }
        
        // finalVotingRecord 생성 (최종 투표가 있는 경우)
        val finalVotingRecord = finalVotingStatus?.map { (playerId, voteForExecution) ->
            val player = players.find { it.id == playerId }
            mapOf(
                "voterPlayerId" to playerId,
                "voterNickname" to (player?.nickname ?: "Unknown"),
                "voteForExecution" to (voteForExecution ?: false)
            )
        }

        return DefenseRecoveryResponse(
            gameNumber = gameNumber,
            hasActiveDefense = defenseStatus != null && !defenseStatus.isDefenseSubmitted,
            hasActiveFinalVoting = finalVotingStatus != null,
            accusedPlayerId = defenseStatus?.accusedPlayerId,
            accusedPlayerNickname = accusedPlayer?.nickname,
            defenseText = defenseStatus?.defenseText,
            isDefenseSubmitted = defenseStatus?.isDefenseSubmitted ?: false,
            // 일관된 필드들
            currentPhase = game?.currentPhase,
            phaseEndTime = game?.phaseEndTime,
            finalVotingRecord = finalVotingRecord,
            scoreboard = players.map { org.example.kotlin_liargame.domain.game.dto.response.ScoreboardEntry.from(it) },
            targetPoints = game?.targetPoints
        )
    }
}
