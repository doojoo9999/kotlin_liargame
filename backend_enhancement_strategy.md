# Backend Enhancement Strategy for Complete Game Flow

## Service Architecture Design

### 2.1 GameFlowService - Central Game Orchestration

```kotlin
@Service
@Transactional
class GameFlowService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val moderatorService: ModeratorService,
    private val scoringService: ScoringService,
    private val gameTimerService: GameTimerService,
    private val gameMessagingService: GameMessagingService,
    private val gameStateService: GameStateService
) {
    
    /**
     * Master phase transition controller with moderator commentary
     */
    fun transitionToNextPhase(gameNumber: Int): GamePhaseTransitionResponse {
        val game = gameRepository.findByGameNumber(gameNumber) 
            ?: throw GameNotFoundException("Game not found: $gameNumber")
        
        val currentPhase = game.currentPhase
        val nextPhase = determineNextPhase(currentPhase, game)
        
        // Generate contextual moderator commentary
        val commentary = moderatorService.generatePhaseTransitionCommentary(
            gameNumber, currentPhase, nextPhase, game
        )
        
        // Update game state
        game.currentPhase = nextPhase
        game.phaseEndTime = gameTimerService.calculatePhaseEndTime(nextPhase)
        gameRepository.save(game)
        
        // Start phase-specific timers
        gameTimerService.startPhaseTimer(gameNumber, nextPhase)
        
        // Broadcast transition with commentary
        val response = GamePhaseTransitionResponse(
            gameNumber = gameNumber,
            previousPhase = currentPhase,
            currentPhase = nextPhase,
            moderatorCommentary = commentary,
            phaseEndTime = game.phaseEndTime,
            timestamp = Instant.now()
        )
        
        gameMessagingService.broadcastPhaseTransition(gameNumber, response)
        return response
    }
    
    /**
     * Complete round progression with scoring calculation
     */
    fun completeRound(gameNumber: Int): RoundCompletionResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException("Game not found: $gameNumber")
        
        // Calculate round scores
        val roundScores = scoringService.calculateRoundScores(gameNumber)
        
        // Update player scores
        scoringService.applyRoundScores(gameNumber, roundScores)
        
        // Check victory conditions
        val victoryResult = scoringService.checkVictoryConditions(gameNumber)
        
        if (victoryResult.hasWinner) {
            return handleGameVictory(gameNumber, victoryResult)
        } else if (game.gameCurrentRound >= game.gameTotalRounds) {
            return handleMaxRoundsReached(gameNumber)
        } else {
            return prepareNextRound(gameNumber)
        }
    }
    
    private fun handleGameVictory(gameNumber: Int, victory: VictoryResult): RoundCompletionResponse {
        val commentary = moderatorService.generateVictoryCommentary(gameNumber, victory)
        
        return RoundCompletionResponse(
            gameNumber = gameNumber,
            roundCompleted = true,
            gameEnded = true,
            winner = victory.winner,
            finalScores = victory.finalScores,
            moderatorCommentary = commentary,
            postGameOptions = generatePostGameOptions(gameNumber)
        )
    }
}
```

### 2.2 ModeratorService - Dynamic Commentary System

```kotlin
@Service
class ModeratorService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val chatService: ChatService,
    private val gameMessagingService: GameMessagingService
) {
    
    /**
     * Generate contextual commentary based on game state and phase
     */
    fun generatePhaseTransitionCommentary(
        gameNumber: Int, 
        fromPhase: GamePhase, 
        toPhase: GamePhase, 
        game: GameEntity
    ): ModeratorCommentary {
        
        val context = buildGameContext(gameNumber, game)
        val commentary = when (toPhase) {
            GamePhase.SPEECH -> generateHintPhaseCommentary(context)
            GamePhase.VOTING_FOR_LIAR -> generateVotingPhaseCommentary(context)
            GamePhase.DEFENDING -> generateDefensePhaseCommentary(context)
            GamePhase.VOTING_FOR_SURVIVAL -> generateFinalVotingCommentary(context)
            GamePhase.GUESSING_WORD -> generateWordGuessCommentary(context)
            GamePhase.GAME_OVER -> generateGameOverCommentary(context)
            else -> generateGenericCommentary(fromPhase, toPhase)
        }
        
        // Store commentary for history
        storeCommentary(gameNumber, commentary)
        
        return commentary
    }
    
    private fun generateHintPhaseCommentary(context: GameContext): ModeratorCommentary {
        val messages = mutableListOf<String>()
        
        when (context.currentRound) {
            1 -> messages.add("첫 번째 라운드가 시작됩니다! 시민 여러분은 주제 '${context.citizenSubject}'에 대한 힌트를 주세요.")
            else -> messages.add("${context.currentRound}번째 라운드입니다. 지금까지의 힌트를 바탕으로 신중하게 생각해보세요.")
        }
        
        if (context.totalPlayers >= 6) {
            messages.add("참여자가 많으니 간결하고 명확한 힌트를 주세요!")
        }
        
        messages.add("제한시간은 ${context.hintTimeLimit}초입니다. 차례대로 힌트를 말해주세요.")
        
        return ModeratorCommentary(
            phase = GamePhase.SPEECH,
            messages = messages,
            importance = CommentaryImportance.HIGH,
            timestamp = Instant.now()
        )
    }
    
    private fun generateVotingPhaseCommentary(context: GameContext): ModeratorCommentary {
        val messages = mutableListOf<String>()
        
        messages.add("투표 시간입니다! 지금까지 들은 힌트를 바탕으로 라이어를 찾아보세요.")
        
        if (context.hasMultipleLiars) {
            messages.add("라이어가 ${context.liarCount}명 있다는 것을 잊지 마세요!")
        }
        
        messages.add("신중하게 투표해주세요. 과반수가 넘으면 바로 변론 단계로 넘어갑니다.")
        
        return ModeratorCommentary(
            phase = GamePhase.VOTING_FOR_LIAR,
            messages = messages,
            importance = CommentaryImportance.MEDIUM,
            timestamp = Instant.now()
        )
    }
    
    /**
     * Generate dynamic commentary based on voting progress
     */
    fun generateVotingProgressCommentary(gameNumber: Int, progress: VotingProgress): ModeratorCommentary? {
        return when {
            progress.isNearMajority() -> ModeratorCommentary(
                phase = GamePhase.VOTING_FOR_LIAR,
                messages = listOf("곧 과반수에 도달할 것 같습니다! 남은 분들은 신중하게 투표해주세요."),
                importance = CommentaryImportance.LOW,
                timestamp = Instant.now()
            )
            progress.isMajorityReached() -> ModeratorCommentary(
                phase = GamePhase.VOTING_FOR_LIAR,
                messages = listOf("과반수에 도달했습니다! ${progress.topCandidate.nickname}님이 변론 기회를 가집니다."),
                importance = CommentaryImportance.HIGH,
                timestamp = Instant.now()
            )
            else -> null
        }
    }
    
    /**
     * Store commentary for game history and replay
     */
    private fun storeCommentary(gameNumber: Int, commentary: ModeratorCommentary) {
        chatService.saveSystemMessage(
            gameNumber = gameNumber,
            content = commentary.messages.joinToString(" "),
            type = ChatMessageType.SYSTEM,
            metadata = mapOf(
                "commentaryType" to "MODERATOR",
                "phase" to commentary.phase.toString(),
                "importance" to commentary.importance.toString()
            )
        )
    }
    
    /**
     * Send commentary to all players via WebSocket
     */
    fun broadcastCommentary(gameNumber: Int, commentary: ModeratorCommentary) {
        gameMessagingService.sendModeratorMessage(gameNumber, commentary.messages.joinToString("\n"))
        
        val event = ModeratorCommentaryEvent(
            type = "MODERATOR_COMMENTARY",
            gameNumber = gameNumber,
            commentary = commentary,
            timestamp = Instant.now()
        )
        
        gameMessagingService.broadcastGameEvent(gameNumber, event)
    }
}
```

### 2.3 ScoringService - Advanced Scoring System

```kotlin
@Service
@Transactional
class ScoringService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val scoreHistoryRepository: ScoreHistoryRepository,
    private val gameProperties: GameProperties
) {
    
    /**
     * Calculate comprehensive round scores based on game outcome
     */
    fun calculateRoundScores(gameNumber: Int): RoundScoringResult {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException("Game not found: $gameNumber")
            
        val players = playerRepository.findByGame(game)
        val gameOutcome = determineRoundOutcome(game, players)
        
        val scores = when (gameOutcome.type) {
            RoundOutcomeType.LIAR_ELIMINATED_CORRECTLY -> calculateLiarEliminatedScores(gameOutcome)
            RoundOutcomeType.INNOCENT_ELIMINATED -> calculateInnocentEliminatedScores(gameOutcome)
            RoundOutcomeType.LIAR_SURVIVED -> calculateLiarSurvivedScores(gameOutcome)
            RoundOutcomeType.LIAR_GUESSED_CORRECTLY -> calculateLiarCorrectGuessScores(gameOutcome)
            else -> calculateDefaultScores(gameOutcome)
        }
        
        return RoundScoringResult(
            gameNumber = gameNumber,
            round = game.gameCurrentRound,
            outcome = gameOutcome,
            playerScores = scores,
            timestamp = Instant.now()
        )
    }
    
    private fun calculateLiarEliminatedScores(outcome: RoundOutcome): Map<Long, PlayerRoundScore> {
        val scores = mutableMapOf<Long, PlayerRoundScore>()
        
        outcome.players.forEach { player ->
            val baseScore = when {
                player.isLiar && player.wasEliminated -> 0 // Eliminated liar gets nothing
                player.isLiar && !player.wasEliminated -> 5 // Surviving liar bonus
                !player.isLiar && player.votedCorrectly -> 3 // Citizen voted correctly
                !player.isLiar && !player.votedCorrectly -> 0 // Citizen voted incorrectly
                else -> 0
            }
            
            val bonusScore = calculateBonusPoints(player, outcome)
            val totalScore = baseScore + bonusScore
            
            scores[player.userId] = PlayerRoundScore(
                userId = player.userId,
                nickname = player.nickname,
                baseScore = baseScore,
                bonusScore = bonusScore,
                totalScore = totalScore,
                reason = generateScoreReason(player, outcome, baseScore, bonusScore)
            )
        }
        
        return scores
    }
    
    /**
     * Apply calculated scores to player totals
     */
    fun applyRoundScores(gameNumber: Int, roundResult: RoundScoringResult) {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException("Game not found: $gameNumber")
            
        roundResult.playerScores.forEach { (userId, roundScore) ->
            val player = playerRepository.findByUserIdAndGame(userId, game)
                ?: return@forEach
                
            // Update player's total score
            player.score += roundScore.totalScore
            playerRepository.save(player)
            
            // Record score history
            val scoreHistory = ScoreHistoryEntity(
                gameNumber = gameNumber,
                userId = userId,
                round = game.gameCurrentRound,
                baseScore = roundScore.baseScore,
                bonusScore = roundScore.bonusScore,
                totalScore = roundScore.totalScore,
                cumulativeScore = player.score,
                reason = roundScore.reason,
                outcome = roundResult.outcome.type
            )
            scoreHistoryRepository.save(scoreHistory)
        }
    }
    
    /**
     * Check victory conditions after each round
     */
    fun checkVictoryConditions(gameNumber: Int): VictoryResult {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException("Game not found: $gameNumber")
            
        val players = playerRepository.findByGame(game).filter { it.isAlive }
        val currentScores = players.associate { it.userId to it.score }
        val targetPoints = game.targetPoints
        
        // Check primary victory condition: target points reached
        val winners = players.filter { it.score >= targetPoints }
        
        return when {
            winners.size == 1 -> VictoryResult(
                hasWinner = true,
                winner = winners.first(),
                winnerType = VictoryType.TARGET_POINTS_REACHED,
                finalScores = currentScores,
                isGameEnded = true
            )
            
            winners.size > 1 -> {
                // Multiple players reached target - highest score wins
                val highestScore = winners.maxOf { it.score }
                val topWinners = winners.filter { it.score == highestScore }
                
                if (topWinners.size == 1) {
                    VictoryResult(
                        hasWinner = true,
                        winner = topWinners.first(),
                        winnerType = VictoryType.HIGHEST_SCORE_AT_TARGET,
                        finalScores = currentScores,
                        isGameEnded = true
                    )
                } else {
                    // Exact tie - sudden death round needed
                    VictoryResult(
                        hasWinner = false,
                        winnerType = VictoryType.TIE_BREAKER_NEEDED,
                        finalScores = currentScores,
                        tiedPlayers = topWinners,
                        isGameEnded = false
                    )
                }
            }
            
            game.gameCurrentRound >= game.gameTotalRounds -> {
                // Max rounds reached - highest score wins
                val highestScore = players.maxOf { it.score }
                val topPlayers = players.filter { it.score == highestScore }
                
                VictoryResult(
                    hasWinner = topPlayers.size == 1,
                    winner = if (topPlayers.size == 1) topPlayers.first() else null,
                    winnerType = if (topPlayers.size == 1) VictoryType.MAX_ROUNDS_HIGHEST_SCORE else VictoryType.TIE_BREAKER_NEEDED,
                    finalScores = currentScores,
                    tiedPlayers = if (topPlayers.size > 1) topPlayers else emptyList(),
                    isGameEnded = topPlayers.size == 1
                )
            }
            
            else -> VictoryResult(
                hasWinner = false,
                finalScores = currentScores,
                isGameEnded = false
            )
        }
    }
    
    /**
     * Get detailed scoring history for a game
     */
    fun getGameScoringHistory(gameNumber: Int): GameScoringHistory {
        val scoreHistory = scoreHistoryRepository.findByGameNumberOrderByRoundAsc(gameNumber)
        val roundSummaries = scoreHistory.groupBy { it.round }.map { (round, scores) ->
            RoundScoreSummary(
                round = round,
                playerScores = scores.map { 
                    PlayerRoundScore(
                        userId = it.userId,
                        nickname = getPlayerNickname(it.userId, gameNumber),
                        baseScore = it.baseScore,
                        bonusScore = it.bonusScore,
                        totalScore = it.totalScore,
                        reason = it.reason
                    )
                },
                outcome = scores.first().outcome
            )
        }
        
        return GameScoringHistory(
            gameNumber = gameNumber,
            rounds = roundSummaries,
            finalScores = getCurrentGameScores(gameNumber)
        )
    }
}
```

### 2.4 GameTimerService - Enhanced Timer Management

```kotlin
@Service
class GameTimerService(
    private val taskScheduler: TaskScheduler,
    private val gameRepository: GameRepository,
    private val gameFlowService: GameFlowService,
    private val gameMessagingService: GameMessagingService,
    private val gameProperties: GameProperties
) {
    
    private val activeTimers = ConcurrentHashMap<String, ScheduledFuture<*>>()
    
    /**
     * Start phase-specific timer with dynamic duration
     */
    fun startPhaseTimer(gameNumber: Int, phase: GamePhase): PhaseTimer {
        val duration = calculatePhaseDuration(gameNumber, phase)
        val endTime = Instant.now().plusSeconds(duration.toLong())
        
        // Cancel existing timer for this game
        cancelPhaseTimer(gameNumber)
        
        val timerKey = "game_${gameNumber}_phase_${phase}"
        
        val timerTask = taskScheduler.schedule({
            handlePhaseTimeout(gameNumber, phase)
        }, endTime)
        
        activeTimers[timerKey] = timerTask
        
        // Start countdown broadcasts
        startCountdownBroadcast(gameNumber, phase, duration)
        
        return PhaseTimer(
            gameNumber = gameNumber,
            phase = phase,
            duration = duration,
            endTime = endTime,
            isActive = true
        )
    }
    
    /**
     * Calculate dynamic phase duration based on game context
     */
    fun calculatePhaseDuration(gameNumber: Int, phase: GamePhase): Int {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: return getDefaultPhaseDuration(phase)
            
        val baseDuration = getDefaultPhaseDuration(phase)
        val playerCount = playerRepository.countActivePlayersByGame(game)
        
        return when (phase) {
            GamePhase.SPEECH -> {
                // Scale hint time based on player count and round
                val perPlayerTime = if (game.gameCurrentRound <= 2) 45 else 40
                baseDuration + (playerCount - 4) * 5 // +5 seconds per player above 4
            }
            
            GamePhase.VOTING_FOR_LIAR -> {
                baseDuration + (playerCount - 4) * 10 // More time for more players
            }
            
            GamePhase.DEFENDING -> {
                baseDuration // Fixed defense time regardless of player count
            }
            
            GamePhase.VOTING_FOR_SURVIVAL -> {
                baseDuration + (playerCount - 4) * 5
            }
            
            else -> baseDuration
        }
    }
    
    private fun startCountdownBroadcast(gameNumber: Int, phase: GamePhase, totalSeconds: Int) {
        val countdownKey = "countdown_${gameNumber}_${phase}"
        
        // Send countdown updates every 10 seconds, then every second for last 10 seconds
        val countdownTask = taskScheduler.scheduleAtFixedRate({
            val remaining = calculateRemainingTime(gameNumber, phase)
            
            when {
                remaining <= 0 -> {
                    cancelCountdown(countdownKey)
                }
                remaining <= 10 || remaining % 10 == 0 -> {
                    gameMessagingService.sendCountdownUpdate(gameNumber, remaining, phase.toString())
                    
                    if (remaining <= 5 && remaining > 0) {
                        sendUrgencyWarning(gameNumber, phase, remaining)
                    }
                }
            }
        }, Instant.now().plusSeconds(1), Duration.ofSeconds(1))
        
        activeTimers[countdownKey] = countdownTask
    }
    
    private fun handlePhaseTimeout(gameNumber: Int, phase: GamePhase) {
        try {
            when (phase) {
                GamePhase.SPEECH -> handleHintPhaseTimeout(gameNumber)
                GamePhase.VOTING_FOR_LIAR -> handleVotingTimeout(gameNumber)
                GamePhase.DEFENDING -> handleDefenseTimeout(gameNumber)
                GamePhase.VOTING_FOR_SURVIVAL -> handleFinalVotingTimeout(gameNumber)
                GamePhase.GUESSING_WORD -> handleWordGuessTimeout(gameNumber)
                else -> {
                    // Default: move to next phase
                    gameFlowService.transitionToNextPhase(gameNumber)
                }
            }
        } catch (e: Exception) {
            logger.error("Error handling phase timeout for game $gameNumber, phase $phase", e)
        }
    }
    
    private fun handleHintPhaseTimeout(gameNumber: Int) {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return
        val players = playerRepository.findByGame(game)
        
        // Auto-skip players who haven't given hints
        val playersWithoutHints = players.filter { 
            it.state == PlayerState.WAITING_FOR_HINT 
        }
        
        if (playersWithoutHints.isNotEmpty()) {
            playersWithoutHints.forEach { player ->
                player.hint = "[시간 초과 - 힌트를 제공하지 않음]"
                player.state = PlayerState.GAVE_HINT
                playerRepository.save(player)
            }
            
            gameMessagingService.sendModeratorMessage(
                gameNumber, 
                "일부 플레이어가 시간 내에 힌트를 제공하지 않아 자동으로 넘어갑니다."
            )
        }
        
        gameFlowService.transitionToNextPhase(gameNumber)
    }
    
    /**
     * Emergency time extension (host only, once per phase)
     */
    fun extendPhaseTime(gameNumber: Int, extensionSeconds: Int, requestingUserId: Long): TimeExtensionResult {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException("Game not found")
            
        // Verify host permission
        if (!isGameHost(game, requestingUserId)) {
            throw UnauthorizedException("Only game host can extend time")
        }
        
        // Check if extension already used for this phase
        val currentPhase = game.currentPhase
        val extensionKey = "${gameNumber}_${currentPhase}_extension"
        
        if (activeTimers.containsKey(extensionKey)) {
            throw IllegalStateException("Time extension already used for this phase")
        }
        
        // Cancel current timer and restart with extended time
        cancelPhaseTimer(gameNumber)
        
        val newEndTime = Instant.now().plusSeconds(extensionSeconds.toLong())
        val timerTask = taskScheduler.schedule({
            handlePhaseTimeout(gameNumber, currentPhase)
        }, newEndTime)
        
        activeTimers["game_${gameNumber}_phase_${currentPhase}"] = timerTask
        activeTimers[extensionKey] = timerTask // Mark extension as used
        
        game.phaseEndTime = newEndTime
        gameRepository.save(game)
        
        gameMessagingService.sendModeratorMessage(
            gameNumber,
            "방장이 시간을 ${extensionSeconds}초 연장했습니다."
        )
        
        return TimeExtensionResult(
            gameNumber = gameNumber,
            phase = currentPhase,
            extensionSeconds = extensionSeconds,
            newEndTime = newEndTime,
            success = true
        )
    }
}
```

## 3. Database Schema Enhancements

```kotlin
// New entities for enhanced scoring and commentary

@Entity
@Table(name = "score_history")
class ScoreHistoryEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    val gameNumber: Int,
    val userId: Long,
    val round: Int,
    val baseScore: Int,
    val bonusScore: Int,
    val totalScore: Int,
    val cumulativeScore: Int,
    
    @Column(columnDefinition = "TEXT")
    val reason: String,
    
    @Enumerated(EnumType.STRING)
    val outcome: RoundOutcomeType,
    
    @Column(name = "awarded_at")
    val awardedAt: Instant = Instant.now()
)

@Entity
@Table(name = "moderator_commentary")
class ModeratorCommentaryEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    val gameNumber: Int,
    
    @Enumerated(EnumType.STRING)
    val phase: GamePhase,
    
    @Column(columnDefinition = "TEXT")
    val content: String,
    
    @Enumerated(EnumType.STRING)
    val importance: CommentaryImportance,
    
    @Column(name = "created_at")
    val createdAt: Instant = Instant.now()
)

@Entity
@Table(name = "game_statistics")
class GameStatisticsEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    val gameNumber: Int,
    val totalDuration: Long, // in seconds
    val totalRounds: Int,
    val averageRoundDuration: Long,
    val totalHintsGiven: Int,
    val totalVotesCast: Int,
    val accurateVotesCount: Int,
    val liarsIdentifiedCount: Int,
    val citizensEliminatedCount: Int,
    
    @Enumerated(EnumType.STRING)
    val finalOutcome: WinningTeam,
    
    @Column(name = "completed_at")
    val completedAt: Instant = Instant.now()
)

// Enhanced PlayerEntity with additional fields
@Entity
@Table(name = "player")
class PlayerEntity(
    // ... existing fields ...
    
    // New scoring fields
    var roundsWon: Int = 0,
    var roundsLost: Int = 0,
    var accurateVotes: Int = 0,
    var totalVotes: Int = 0,
    var successfulLiarRounds: Int = 0,
    var timeAsLiar: Int = 0,
    
    // Performance tracking
    @Column(name = "average_hint_time")
    var averageHintTime: Double? = null,
    
    @Column(name = "consistency_score")
    var consistencyScore: Double? = null,
    
    // Achievements
    @Column(columnDefinition = "TEXT")
    var achievements: String? = null
)
```

## 4. WebSocket Message Protocol Enhancements

```kotlin
// Enhanced message types for complete game flow

data class ModeratorCommentaryEvent(
    val type: String = "MODERATOR_COMMENTARY",
    val gameNumber: Int,
    val commentary: ModeratorCommentary,
    val timestamp: Instant
)

data class ScoreUpdateEvent(
    val type: String = "SCORE_UPDATE",
    val gameNumber: Int,
    val playerScores: Map<Long, Int>,
    val roundScores: Map<Long, PlayerRoundScore>?,
    val timestamp: Instant
)

data class VictoryAchievedEvent(
    val type: String = "VICTORY_ACHIEVED",
    val gameNumber: Int,
    val winner: PlayerInfo,
    val winnerType: VictoryType,
    val finalScores: Map<Long, Int>,
    val gameStatistics: GameStatistics,
    val postGameOptions: PostGameOptions,
    val timestamp: Instant
)

data class PostGameOptionEvent(
    val type: String = "POST_GAME_OPTION",
    val gameNumber: Int,
    val option: PostGameAction, // PLAY_AGAIN, RETURN_LOBBY, VIEW_STATISTICS
    val playerChoices: Map<Long, PostGameAction>,
    val timestamp: Instant
)

data class GameFlowTransitionEvent(
    val type: String = "GAME_FLOW_TRANSITION",
    val gameNumber: Int,
    val fromPhase: GamePhase,
    val toPhase: GamePhase,
    val transitionReason: String,
    val moderatorCommentary: String?,
    val nextAction: String?, // What players should do next
    val timeLimit: Int?, // Seconds for next phase
    val timestamp: Instant
)

// Enhanced WebSocket subscription channels:
// /topic/game/{gameNumber}/flow - Game flow transitions
// /topic/game/{gameNumber}/scoring - Real-time score updates  
// /topic/game/{gameNumber}/moderator - Moderator commentary
// /topic/game/{gameNumber}/victory - Victory announcements
// /topic/game/{gameNumber}/post-game - Post-game options
```

## 5. Integration Points with Existing Services

### 5.1 GameService Integration
```kotlin
@Service
class EnhancedGameService(
    // ... existing dependencies ...
    private val gameFlowService: GameFlowService,
    private val moderatorService: ModeratorService,
    private val scoringService: ScoringService,
    private val gameTimerService: GameTimerService
) {
    
    /**
     * Enhanced game start with moderator introduction
     */
    override fun startGame(gameNumber: Int, session: HttpSession): GameStateResponse {
        val response = super.startGame(gameNumber, session)
        
        // Generate opening moderator commentary
        val commentary = moderatorService.generateGameStartCommentary(gameNumber)
        moderatorService.broadcastCommentary(gameNumber, commentary)
        
        // Start enhanced timer system
        gameTimerService.startPhaseTimer(gameNumber, GamePhase.SPEECH)
        
        return response
    }
    
    /**
     * Enhanced hint submission with flow management
     */
    override fun submitHint(request: GiveHintRequest, session: HttpSession): GameStateResponse {
        val response = super.submitHint(request, session)
        
        // Check if all hints are collected
        val game = gameRepository.findByGameNumber(request.gameNumber)!!
        val players = playerRepository.findByGame(game)
        
        if (players.all { it.state == PlayerState.GAVE_HINT }) {
            // All hints collected - transition to voting with commentary
            gameFlowService.transitionToNextPhase(request.gameNumber)
        }
        
        return response
    }
}
```

### 5.2 VotingService Integration
```kotlin
@Service 
class EnhancedVotingService(
    // ... existing dependencies ...
    private val moderatorService: ModeratorService,
    private val gameFlowService: GameFlowService
) {
    
    override fun castVote(request: CastVoteRequest, session: HttpSession): CastVoteResponse {
        val response = super.castVote(request, session)
        
        // Check for majority and generate commentary
        val progress = getVotingProgress(request.gameNumber)
        val commentary = moderatorService.generateVotingProgressCommentary(request.gameNumber, progress)
        
        commentary?.let {
            moderatorService.broadcastCommentary(request.gameNumber, it)
        }
        
        // Auto-transition if majority reached
        if (progress.isMajorityReached()) {
            gameFlowService.transitionToNextPhase(request.gameNumber)
        }
        
        return response
    }
}
```

## 6. Error Handling and Resilience

```kotlin
@Component
class GameFlowErrorHandler {
    
    @EventListener
    fun handlePhaseTransitionError(event: PhaseTransitionErrorEvent) {
        // Attempt to recover game state
        val game = gameRepository.findByGameNumber(event.gameNumber)
        if (game != null) {
            // Reset to last known good state
            recoverGameState(game)
            
            // Notify players of recovery
            gameMessagingService.sendModeratorMessage(
                event.gameNumber,
                "시스템 오류가 발생했지만 게임 상태를 복구했습니다. 계속 진행해주세요."
            )
        }
    }
    
    @EventListener 
    fun handleScoringError(event: ScoringErrorEvent) {
        // Recalculate scores with fallback logic
        val fallbackScores = scoringService.calculateFallbackScores(event.gameNumber)
        scoringService.applyFallbackScores(event.gameNumber, fallbackScores)
    }
}
```

This comprehensive strategy extends the existing backend architecture to support:

1. **Complete game flow** with dynamic phase transitions
2. **Rich moderator commentary** that adapts to game context
3. **Advanced scoring system** with detailed history and victory conditions
4. **Robust timer management** with dynamic durations and emergency extensions
5. **Enhanced WebSocket messaging** for real-time game flow updates
6. **Comprehensive error handling** and state recovery
7. **Post-game options** for seamless play continuation

The implementation maintains backward compatibility with existing APIs while adding powerful new capabilities for the complete game experience.