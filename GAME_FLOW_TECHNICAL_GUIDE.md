# Liar Game Flow - Technical Implementation Guide

## Integration with Existing Codebase

This document provides specific technical guidance for implementing the game flow mechanics within the current Kotlin/Spring Boot + React architecture.

## 1. Backend Implementation Updates

### 1.1 Enhanced GameEntity Modifications

```kotlin
// src/main/kotlin/org/example/kotlin_liargame/domain/game/model/GameEntity.kt

@Entity
@Table(name = "game")
class GameEntity(
    // ... existing fields ...
    
    // New scoring system fields
    @Column(nullable = false)
    val targetPoints: Int = 10,
    
    @Column(nullable = false)
    var currentPhaseStartTime: Instant? = null,
    
    @Column(nullable = false)
    var phaseDurationSeconds: Int = 0,
    
    // Round management
    @Column(nullable = false)
    var roundStartTime: Instant? = null,
    
    @Column(nullable = false)
    var isLastRound: Boolean = false,
    
    // Voting mechanics
    @Column(nullable = false)
    var votingStartTime: Instant? = null,
    
    @Column(nullable = false)
    var totalVotesCast: Int = 0,
    
    @Column(nullable = false)
    var requiredVoteCount: Int = 0,
    
    // Game flow state
    @Column(columnDefinition = "TEXT")
    var gameFlowData: String? = null // JSON data for complex state
) : BaseEntity() {
    
    // Enhanced phase management
    fun startPhase(phase: GamePhase, durationSeconds: Int) {
        currentPhase = phase
        currentPhaseStartTime = Instant.now()
        phaseDurationSeconds = durationSeconds
    }
    
    fun getRemainingPhaseTime(): Long {
        val startTime = currentPhaseStartTime ?: return 0
        val elapsed = Duration.between(startTime, Instant.now()).seconds
        return maxOf(0, phaseDurationSeconds - elapsed)
    }
    
    fun isPhaseExpired(): Boolean {
        return getRemainingPhaseTime() <= 0
    }
    
    // Victory condition checking
    fun checkVictoryCondition(players: List<PlayerEntity>): PlayerEntity? {
        return players.find { it.cumulativeScore >= targetPoints }
    }
    
    // Dynamic phase duration calculation
    fun calculatePhaseDuration(phase: GamePhase, playerCount: Int): Int {
        return when (phase) {
            GamePhase.SPEECH -> 45 + (playerCount - 4) * 5
            GamePhase.VOTING_FOR_LIAR -> 60 + (playerCount - 4) * 5
            GamePhase.DEFENDING -> 90
            GamePhase.VOTING_FOR_SURVIVAL -> 45
            else -> 30
        }
    }
}
```

### 1.2 Enhanced PlayerEntity Scoring System

```kotlin
// src/main/kotlin/org/example/kotlin_liargame/domain/game/model/PlayerEntity.kt

@Entity
@Table(name = "player")
class PlayerEntity(
    // ... existing fields ...
    
    // Enhanced scoring fields
    @Column(nullable = false)
    var roundScore: Int = 0,
    
    @Column(nullable = false)
    var totalGamesWon: Int = 0,
    
    @Column(nullable = false)
    var accuracyRating: Double = 0.0,
    
    // Performance tracking
    @Column(nullable = false)
    var correctVoteCount: Int = 0,
    
    @Column(nullable = false)
    var totalVoteCount: Int = 0,
    
    @Column(nullable = false)
    var successfulLiarRounds: Int = 0,
    
    @Column(nullable = false)
    var totalLiarRounds: Int = 0
) {
    
    // Scoring logic methods
    fun awardPoints(scenario: ScoringScenario, context: GameContext): Int {
        val points = when (scenario) {
            ScoringScenario.LIAR_ELIMINATED_CORRECT_VOTE -> 3
            ScoringScenario.LIAR_ELIMINATED_WRONG_VOTE -> 0
            ScoringScenario.INNOCENT_ELIMINATED_VOTED_GUILTY -> -1
            ScoringScenario.INNOCENT_ELIMINATED_VOTED_INNOCENT -> 1
            ScoringScenario.LIAR_SURVIVED -> if (role == PlayerRole.LIAR) 6 else 0
            ScoringScenario.TOPIC_GUESS_CORRECT -> 3
            ScoringScenario.TOPIC_GUESS_WRONG -> 0
        }
        
        roundScore += points
        cumulativeScore += points
        return points
    }
    
    // Performance calculation
    fun updateAccuracy() {
        if (totalVoteCount > 0) {
            accuracyRating = correctVoteCount.toDouble() / totalVoteCount.toDouble()
        }
    }
    
    // End of round cleanup
    fun prepareForNextRound() {
        resetForNewRound()
        roundScore = 0
    }
}

enum class ScoringScenario {
    LIAR_ELIMINATED_CORRECT_VOTE,
    LIAR_ELIMINATED_WRONG_VOTE,
    INNOCENT_ELIMINATED_VOTED_GUILTY,
    INNOCENT_ELIMINATED_VOTED_INNOCENT,
    LIAR_SURVIVED,
    TOPIC_GUESS_CORRECT,
    TOPIC_GUESS_WRONG
}

data class GameContext(
    val eliminatedPlayer: PlayerEntity,
    val wasLiar: Boolean,
    val correctGuess: Boolean = false
)
```

### 1.3 New Game Flow Service

```kotlin
// src/main/kotlin/org/example/kotlin_liargame/domain/game/service/GameFlowService.kt

@Service
@Transactional
class GameFlowService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val gameMonitoringService: GameMonitoringService,
    private val scoringService: ScoringService,
    private val timerService: GameTimerService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
    
    fun startGameFlow(gameNumber: Int): GameFlowResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)
            
        val players = playerRepository.findByGame(game)
        
        // Initialize first phase
        game.startPhase(GamePhase.SPEECH, game.calculatePhaseDuration(GamePhase.SPEECH, players.size))
        gameRepository.save(game)
        
        // Setup turn order
        setupTurnOrder(game, players)
        
        // Start phase timer
        timerService.startPhaseTimer(gameNumber, game.getRemainingPhaseTime()) {
            handlePhaseTimeout(gameNumber)
        }
        
        return GameFlowResponse.from(game, players)
    }
    
    fun advancePhase(gameNumber: Int): GameFlowResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)
            
        val players = playerRepository.findByGame(game)
        val nextPhase = determineNextPhase(game, players)
        
        when (nextPhase) {
            GamePhase.VOTING_FOR_LIAR -> handleVotingPhase(game, players)
            GamePhase.DEFENDING -> handleDefensePhase(game, players)
            GamePhase.VOTING_FOR_SURVIVAL -> handleSurvivalVotePhase(game, players)
            GamePhase.GUESSING_WORD -> handleTopicGuessPhase(game, players)
            else -> {
                // Calculate scores and check victory
                val roundResult = calculateRoundScore(game, players)
                val winner = checkVictoryCondition(game, players)
                
                if (winner != null || game.gameCurrentRound >= game.gameTotalRounds) {
                    endGame(game, players, winner)
                } else {
                    startNextRound(game, players)
                }
            }
        }
        
        return GameFlowResponse.from(game, players)
    }
    
    private fun handleVotingPhase(game: GameEntity, players: List<PlayerEntity>) {
        val phaseDuration = game.calculatePhaseDuration(GamePhase.VOTING_FOR_LIAR, players.size)
        game.startPhase(GamePhase.VOTING_FOR_LIAR, phaseDuration)
        game.requiredVoteCount = players.count { it.isAlive }
        
        gameRepository.save(game)
        
        timerService.startPhaseTimer(game.gameNumber, game.getRemainingPhaseTime()) {
            handleVotingTimeout(game.gameNumber)
        }
        
        gameMonitoringService.notifyPhaseChange(game, GamePhase.VOTING_FOR_LIAR)
    }
    
    private fun handleDefensePhase(game: GameEntity, players: List<PlayerEntity>) {
        // Find accused player (player with most votes)
        val accusedPlayer = findMostVotedPlayer(players)
        
        if (accusedPlayer != null) {
            accusedPlayer.accuse()
            playerRepository.save(accusedPlayer)
            
            game.startPhase(GamePhase.DEFENDING, 90)
            game.accusedPlayerId = accusedPlayer.userId
            gameRepository.save(game)
            
            timerService.startPhaseTimer(game.gameNumber, 90) {
                handleDefenseTimeout(game.gameNumber)
            }
            
            gameMonitoringService.notifyPlayerAccused(game, accusedPlayer)
        }
    }
    
    private fun calculateRoundScore(game: GameEntity, players: List<PlayerEntity>): RoundResult {
        val accusedPlayer = players.find { it.state == PlayerState.ACCUSED || it.state == PlayerState.DEFENDED }
        val eliminatedPlayer = if (accusedPlayer != null && wasPlayerEliminated(accusedPlayer, players)) {
            accusedPlayer.eliminate()
            accusedPlayer
        } else null
        
        val roundResult = RoundResult(
            eliminatedPlayer = eliminatedPlayer,
            wasLiarEliminated = eliminatedPlayer?.role == PlayerRole.LIAR,
            correctVoters = findCorrectVoters(players, eliminatedPlayer),
            incorrectVoters = findIncorrectVoters(players, eliminatedPlayer)
        )
        
        // Apply scoring
        scoringService.applyRoundScoring(players, roundResult)
        playerRepository.saveAll(players)
        
        return roundResult
    }
    
    private fun checkVictoryCondition(game: GameEntity, players: List<PlayerEntity>): PlayerEntity? {
        return players.find { it.cumulativeScore >= game.targetPoints }
    }
    
    private fun endGame(game: GameEntity, players: List<PlayerEntity>, winner: PlayerEntity?) {
        game.endGame()
        game.currentPhase = GamePhase.GAME_OVER
        gameRepository.save(game)
        
        // Update player statistics
        players.forEach { player ->
            if (player == winner) {
                player.totalGamesWon++
            }
            player.updateAccuracy()
            playerRepository.save(player)
        }
        
        gameMonitoringService.notifyGameEnd(game, winner, players)
    }
}

data class RoundResult(
    val eliminatedPlayer: PlayerEntity?,
    val wasLiarEliminated: Boolean,
    val correctVoters: List<PlayerEntity>,
    val incorrectVoters: List<PlayerEntity>
)

data class GameFlowResponse(
    val gameNumber: Int,
    val currentPhase: GamePhase,
    val phaseTimeRemaining: Long,
    val currentRound: Int,
    val totalRounds: Int,
    val scoreboard: List<PlayerScore>,
    val winner: String?,
    val isGameComplete: Boolean
) {
    companion object {
        fun from(game: GameEntity, players: List<PlayerEntity>): GameFlowResponse {
            return GameFlowResponse(
                gameNumber = game.gameNumber,
                currentPhase = game.currentPhase,
                phaseTimeRemaining = game.getRemainingPhaseTime(),
                currentRound = game.gameCurrentRound,
                totalRounds = game.gameTotalRounds,
                scoreboard = players.map { PlayerScore(it.nickname, it.cumulativeScore) },
                winner = players.find { it.cumulativeScore >= game.targetPoints }?.nickname,
                isGameComplete = game.gameState == GameState.ENDED
            )
        }
    }
}

data class PlayerScore(
    val nickname: String,
    val score: Int
)
```

### 1.4 Dedicated Scoring Service

```kotlin
// src/main/kotlin/org/example/kotlin_liargame/domain/game/service/ScoringService.kt

@Service
class ScoringService {
    
    fun applyRoundScoring(players: List<PlayerEntity>, result: RoundResult) {
        when {
            // Scenario 1: Liar was correctly eliminated
            result.wasLiarEliminated && result.eliminatedPlayer != null -> {
                result.correctVoters.forEach { it.awardPoints(ScoringScenario.LIAR_ELIMINATED_CORRECT_VOTE, GameContext(result.eliminatedPlayer, true)) }
                result.incorrectVoters.forEach { it.awardPoints(ScoringScenario.LIAR_ELIMINATED_WRONG_VOTE, GameContext(result.eliminatedPlayer, true)) }
                
                // Surviving liars get bonus points
                players.filter { it.role == PlayerRole.LIAR && it.isAlive && it != result.eliminatedPlayer }
                    .forEach { it.awardPoints(ScoringScenario.LIAR_SURVIVED, GameContext(result.eliminatedPlayer, true)) }
            }
            
            // Scenario 2: Innocent was wrongly eliminated  
            result.eliminatedPlayer != null && !result.wasLiarEliminated -> {
                // All liars get points
                players.filter { it.role == PlayerRole.LIAR && it.isAlive }
                    .forEach { it.awardPoints(ScoringScenario.LIAR_SURVIVED, GameContext(result.eliminatedPlayer, false)) }
                
                // Citizens get points/penalties based on vote
                result.incorrectVoters.forEach { it.awardPoints(ScoringScenario.INNOCENT_ELIMINATED_VOTED_GUILTY, GameContext(result.eliminatedPlayer, false)) }
                result.correctVoters.forEach { it.awardPoints(ScoringScenario.INNOCENT_ELIMINATED_VOTED_INNOCENT, GameContext(result.eliminatedPlayer, false)) }
            }
            
            // Scenario 3: No elimination (liar survived vote)
            else -> {
                players.filter { it.role == PlayerRole.LIAR && it.isAlive }
                    .forEach { it.awardPoints(ScoringScenario.LIAR_SURVIVED, GameContext(result.eliminatedPlayer ?: players.first(), true)) }
            }
        }
        
        // Update vote accuracy for all players
        players.forEach { player ->
            if (player.votedFor != null) {
                player.totalVoteCount++
                if (isVoteCorrect(player, result)) {
                    player.correctVoteCount++
                }
                player.updateAccuracy()
            }
        }
    }
    
    fun applyTopicGuessBonus(liar: PlayerEntity, correctGuess: Boolean) {
        val scenario = if (correctGuess) ScoringScenario.TOPIC_GUESS_CORRECT else ScoringScenario.TOPIC_GUESS_WRONG
        liar.awardPoints(scenario, GameContext(liar, true, correctGuess))
    }
    
    private fun isVoteCorrect(player: PlayerEntity, result: RoundResult): Boolean {
        // Vote is correct if:
        // 1. Player voted for actual liar who got eliminated
        // 2. Player voted to save innocent who was accused
        val votedForEliminated = player.votedFor == result.eliminatedPlayer?.userId
        return if (result.wasLiarEliminated) votedForEliminated else !votedForEliminated
    }
}
```

### 1.5 Game Timer Service

```kotlin
// src/main/kotlin/org/example/kotlin_liargame/domain/game/service/GameTimerService.kt

@Service
class GameTimerService {
    private val scheduledExecutor = Executors.newScheduledThreadPool(10)
    private val activeTimers = ConcurrentHashMap<Int, ScheduledFuture<*>>()
    
    fun startPhaseTimer(gameNumber: Int, durationSeconds: Long, onTimeout: () -> Unit) {
        // Cancel existing timer for this game
        cancelTimer(gameNumber)
        
        // Start new timer
        val future = scheduledExecutor.schedule({
            try {
                onTimeout()
            } catch (e: Exception) {
                logger.error("Error in timer callback for game $gameNumber", e)
            } finally {
                activeTimers.remove(gameNumber)
            }
        }, durationSeconds, TimeUnit.SECONDS)
        
        activeTimers[gameNumber] = future
    }
    
    fun cancelTimer(gameNumber: Int) {
        activeTimers.remove(gameNumber)?.cancel(false)
    }
    
    fun getRemainingTime(gameNumber: Int): Long {
        val future = activeTimers[gameNumber]
        return if (future != null && !future.isDone) {
            future.getDelay(TimeUnit.SECONDS)
        } else {
            0
        }
    }
    
    @PreDestroy
    fun shutdown() {
        activeTimers.values.forEach { it.cancel(false) }
        scheduledExecutor.shutdown()
    }
}
```

## 2. Frontend Implementation Updates

### 2.1 Enhanced Game Store

```typescript
// frontend/src/stores/gameStore.ts

interface GameFlowState {
  currentPhase: GamePhase;
  phaseTimeRemaining: number;
  phaseStartTime: number;
  scoreboard: PlayerScore[];
  roundNumber: number;
  totalRounds: number;
  winner: string | null;
  isGameComplete: boolean;
  voteResults: VoteResult[];
  roundHistory: RoundResult[];
}

const useGameFlowStore = create<GameFlowState & GameFlowActions>()(
  devtools(
    (set, get) => ({
      // State
      currentPhase: GamePhase.WAITING_FOR_PLAYERS,
      phaseTimeRemaining: 0,
      phaseStartTime: 0,
      scoreboard: [],
      roundNumber: 1,
      totalRounds: 5,
      winner: null,
      isGameComplete: false,
      voteResults: [],
      roundHistory: [],

      // Actions
      updateGameFlow: (flowData: GameFlowData) => {
        set({
          currentPhase: flowData.currentPhase,
          phaseTimeRemaining: flowData.phaseTimeRemaining,
          phaseStartTime: Date.now(),
          scoreboard: flowData.scoreboard,
          roundNumber: flowData.currentRound,
          totalRounds: flowData.totalRounds,
          winner: flowData.winner,
          isGameComplete: flowData.isGameComplete
        });
      },

      startPhaseTimer: () => {
        const updateTimer = () => {
          const { phaseStartTime, phaseTimeRemaining } = get();
          const elapsed = Math.floor((Date.now() - phaseStartTime) / 1000);
          const remaining = Math.max(0, phaseTimeRemaining - elapsed);
          
          set({ phaseTimeRemaining: remaining });
          
          if (remaining <= 0) {
            get().handlePhaseTimeout();
          }
        };

        // Update every second
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
      },

      handlePhaseTimeout: () => {
        const { currentPhase } = get();
        
        // Auto-advance or handle timeout based on phase
        switch (currentPhase) {
          case GamePhase.SPEECH:
            // Auto-advance to voting
            websocketService.sendGameAction('advance_phase');
            break;
          case GamePhase.VOTING_FOR_LIAR:
            // Handle voting timeout
            websocketService.sendGameAction('handle_vote_timeout');
            break;
          // ... other phase timeout handlers
        }
      },

      addRoundResult: (result: RoundResult) => {
        set(state => ({
          roundHistory: [...state.roundHistory, result]
        }));
      },

      resetGameFlow: () => {
        set({
          currentPhase: GamePhase.WAITING_FOR_PLAYERS,
          phaseTimeRemaining: 0,
          phaseStartTime: 0,
          scoreboard: [],
          roundNumber: 1,
          winner: null,
          isGameComplete: false,
          voteResults: [],
          roundHistory: []
        });
      }
    })
  )
);
```

### 2.2 Phase-Specific React Components

```tsx
// frontend/src/components/game/PhaseManager.tsx

const PhaseManager: React.FC<{ gameNumber: number }> = ({ gameNumber }) => {
  const { currentPhase, phaseTimeRemaining } = useGameFlowStore();
  const { currentRoom } = useGameStore();

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case GamePhase.SPEECH:
        return <HintGivingPhase />;
      case GamePhase.VOTING_FOR_LIAR:
        return <LiarVotingPhase />;
      case GamePhase.DEFENDING:
        return <DefensePhase />;
      case GamePhase.VOTING_FOR_SURVIVAL:
        return <SurvivalVotingPhase />;
      case GamePhase.GUESSING_WORD:
        return <TopicGuessingPhase />;
      case GamePhase.GAME_OVER:
        return <GameEndPhase />;
      default:
        return <WaitingPhase />;
    }
  };

  return (
    <div className="phase-manager">
      <PhaseHeader 
        phase={currentPhase} 
        timeRemaining={phaseTimeRemaining}
      />
      <div className="phase-content">
        {renderPhaseContent()}
      </div>
      <ScoreboardPanel />
    </div>
  );
};

// frontend/src/components/game/phases/HintGivingPhase.tsx

const HintGivingPhase: React.FC = () => {
  const { currentRoom, currentPlayerId, isLiar, currentCategory } = useGameStore();
  const { phaseTimeRemaining } = useGameFlowStore();
  const [currentHint, setCurrentHint] = useState('');

  const isMyTurn = currentRoom?.currentTurnPlayerId === currentPlayerId;
  const maxHintLength = 20;

  const handleSubmitHint = () => {
    if (currentHint.trim() && isMyTurn) {
      websocketService.sendHint(currentRoom!.id, currentHint.trim());
      setCurrentHint('');
    }
  };

  return (
    <div className="hint-giving-phase">
      <div className="topic-display">
        <h3>주제: {currentCategory}</h3>
        {isLiar && (
          <div className="liar-warning">
            당신은 라이어입니다! 주제를 추측하여 힌트를 주세요.
          </div>
        )}
      </div>

      <div className="turn-indicator">
        {isMyTurn ? (
          <div className="my-turn">
            <h4>당신의 차례입니다</h4>
            <Timer seconds={phaseTimeRemaining} />
          </div>
        ) : (
          <div className="waiting-turn">
            다른 플레이어의 차례를 기다리는 중...
          </div>
        )}
      </div>

      {isMyTurn && (
        <div className="hint-input">
          <input
            type="text"
            value={currentHint}
            onChange={(e) => setCurrentHint(e.target.value)}
            maxLength={maxHintLength}
            placeholder="힌트를 입력하세요..."
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitHint()}
          />
          <div className="hint-controls">
            <span className="char-count">
              {currentHint.length}/{maxHintLength}
            </span>
            <button 
              onClick={handleSubmitHint}
              disabled={!currentHint.trim()}
              className="submit-hint-btn"
            >
              힌트 제출
            </button>
          </div>
        </div>
      )}

      <HintsList />
    </div>
  );
};

// frontend/src/components/game/phases/GameEndPhase.tsx

const GameEndPhase: React.FC = () => {
  const { winner, scoreboard, roundHistory } = useGameFlowStore();
  const { currentRoom } = useGameStore();
  const [showStats, setShowStats] = useState(false);
  const [playAgainVotes, setPlayAgainVotes] = useState(0);

  const handlePlayAgain = () => {
    websocketService.sendGameAction(currentRoom!.id, 'vote_play_again');
  };

  const handleReturnToLobby = () => {
    // Navigate back to lobby
    websocketService.leaveGame();
    // router.push('/lobby');
  };

  return (
    <div className="game-end-phase">
      <div className="victory-announcement">
        <div className="winner-display">
          {winner ? (
            <>
              <h1 className="victory-title">🎉 게임 종료 🎉</h1>
              <h2 className="winner-name">{winner} 승리!</h2>
              <div className="victory-animation">
                {/* Confetti animation */}
              </div>
            </>
          ) : (
            <h1>게임 종료 - 무승부</h1>
          )}
        </div>

        <div className="final-scoreboard">
          <h3>최종 순위</h3>
          <div className="score-list">
            {scoreboard
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div key={player.nickname} className={`score-item rank-${index + 1}`}>
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{player.nickname}</span>
                  <span className="score">{player.score}점</span>
                </div>
              ))}
          </div>
        </div>

        <div className="game-actions">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="toggle-stats-btn"
          >
            게임 통계 {showStats ? '숨기기' : '보기'}
          </button>

          <div className="play-again-section">
            <h4>다음 게임</h4>
            <div className="play-again-votes">
              {playAgainVotes}/{currentRoom?.players.length}명이 한 판 더를 원합니다
            </div>
            <div className="end-game-options">
              <button 
                onClick={handlePlayAgain}
                className="play-again-btn"
              >
                한 판 더하기
              </button>
              <button 
                onClick={handleReturnToLobby}
                className="return-lobby-btn"
              >
                로비로 나가기
              </button>
            </div>
          </div>
        </div>

        {showStats && (
          <GameStatistics 
            rounds={roundHistory}
            players={scoreboard}
          />
        )}
      </div>
    </div>
  );
};
```

### 2.3 Timer Components

```tsx
// frontend/src/components/game/Timer.tsx

interface TimerProps {
  seconds: number;
  onTimeout?: () => void;
  showWarning?: boolean;
  warningThreshold?: number;
}

const Timer: React.FC<TimerProps> = ({ 
  seconds, 
  onTimeout, 
  showWarning = true, 
  warningThreshold = 10 
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout?.();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onTimeout]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = showWarning && timeLeft <= warningThreshold;

  return (
    <div className={`timer ${isWarning ? 'timer-warning' : ''}`}>
      <div className="timer-display">
        {formatTime(timeLeft)}
      </div>
      <div className="timer-progress">
        <div 
          className="timer-bar"
          style={{ 
            width: `${(timeLeft / seconds) * 100}%`,
            backgroundColor: isWarning ? '#ff4444' : '#4CAF50'
          }}
        />
      </div>
    </div>
  );
};

// frontend/src/components/game/ScoreboardPanel.tsx

const ScoreboardPanel: React.FC = () => {
  const { scoreboard, roundNumber, totalRounds } = useGameFlowStore();
  const { currentRoom } = useGameStore();

  return (
    <div className="scoreboard-panel">
      <div className="round-info">
        <h4>라운드 {roundNumber}/{totalRounds}</h4>
      </div>
      
      <div className="scores">
        <h5>현재 점수</h5>
        <div className="score-list">
          {scoreboard
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div key={player.nickname} className="score-item">
                <span className="position">#{index + 1}</span>
                <span className="name">{player.nickname}</span>
                <span className="score">{player.score}</span>
                {player.score >= 10 && (
                  <span className="victory-indicator">👑</span>
                )}
              </div>
            ))}
        </div>
      </div>

      <div className="target-score">
        목표: 10점 달성 시 승리
      </div>
    </div>
  );
};
```

## 3. WebSocket Message Protocol

### 3.1 New Message Types

```typescript
// frontend/src/types/websocket.ts

interface GameFlowMessage {
  type: 'PHASE_CHANGE' | 'TIMER_UPDATE' | 'SCORE_UPDATE' | 'GAME_END' | 'PLAY_AGAIN_VOTE';
  payload: any;
}

interface PhaseChangeMessage {
  type: 'PHASE_CHANGE';
  payload: {
    newPhase: GamePhase;
    timeRemaining: number;
    phaseData?: any;
  };
}

interface ScoreUpdateMessage {
  type: 'SCORE_UPDATE';
  payload: {
    roundScores: Array<{
      playerId: string;
      nickname: string;
      roundScore: number;
      totalScore: number;
    }>;
    eliminated?: {
      playerId: string;
      nickname: string;
      wasLiar: boolean;
    };
  };
}

interface GameEndMessage {
  type: 'GAME_END';
  payload: {
    winner: string;
    finalScores: Array<{
      playerId: string;
      nickname: string;
      score: number;
    }>;
    gameStats: {
      totalRounds: number;
      averageRoundTime: number;
    };
  };
}
```

### 3.2 Backend WebSocket Handlers

```kotlin
// src/main/kotlin/org/example/kotlin_liargame/tools/websocket/GameFlowWebSocketHandler.kt

@Component
class GameFlowWebSocketHandler(
    private val gameFlowService: GameFlowService
) {
    
    fun handlePhaseAdvancement(gameNumber: Int) {
        try {
            val response = gameFlowService.advancePhase(gameNumber)
            broadcastPhaseChange(gameNumber, response)
        } catch (e: Exception) {
            logger.error("Error advancing phase for game $gameNumber", e)
        }
    }
    
    fun handlePlayAgainVote(gameNumber: Int, playerId: String) {
        // Track play again votes
        val voteCount = playAgainVotes.merge(gameNumber, 1, Int::plus)
        val game = gameRepository.findByGameNumber(gameNumber)
        val playerCount = game?.let { playerRepository.countByGame(it) } ?: 0
        
        broadcastPlayAgainVotes(gameNumber, voteCount, playerCount)
        
        // If all players voted, start new game
        if (voteCount >= playerCount) {
            startNewGameSession(gameNumber)
        }
    }
    
    private fun broadcastPhaseChange(gameNumber: Int, response: GameFlowResponse) {
        val message = mapOf(
            "type" to "PHASE_CHANGE",
            "payload" to mapOf(
                "newPhase" to response.currentPhase,
                "timeRemaining" to response.phaseTimeRemaining,
                "roundNumber" to response.currentRound,
                "scoreboard" to response.scoreboard
            )
        )
        
        webSocketSessionManager.broadcastToGame(gameNumber, message)
    }
    
    private fun broadcastScoreUpdate(gameNumber: Int, roundScores: List<PlayerScore>) {
        val message = mapOf(
            "type" to "SCORE_UPDATE", 
            "payload" to mapOf(
                "roundScores" to roundScores
            )
        )
        
        webSocketSessionManager.broadcastToGame(gameNumber, message)
    }
}
```

## 4. Configuration & Properties

### 4.1 Game Balance Configuration

```yaml
# src/main/resources/application.yml

game:
  flow:
    phases:
      speech:
        base-duration: 45
        per-player-bonus: 5
        max-duration: 90
      voting:
        base-duration: 60
        per-player-bonus: 5
        max-duration: 120
      defense:
        duration: 90
        questions-allowed: 5
        question-time: 30
      survival-vote:
        duration: 45
    scoring:
      target-points: 10
      liar-survival-bonus: 6
      correct-vote-reward: 3
      wrong-elimination-penalty: -1
      topic-guess-bonus: 3
    balance:
      min-players: 4
      max-players: 8
      liar-count: 1
      max-rounds: 8
```

### 4.2 Game Properties Bean

```kotlin
// src/main/kotlin/org/example/kotlin_liargame/global/config/GameFlowProperties.kt

@ConfigurationProperties(prefix = "game.flow")
@Component
data class GameFlowProperties(
    val phases: PhaseConfig = PhaseConfig(),
    val scoring: ScoringConfig = ScoringConfig(),
    val balance: BalanceConfig = BalanceConfig()
)

data class PhaseConfig(
    val speech: PhaseTimeConfig = PhaseTimeConfig(45, 5, 90),
    val voting: PhaseTimeConfig = PhaseTimeConfig(60, 5, 120),
    val defense: DefenseConfig = DefenseConfig(90, 5, 30),
    val survivalVote: PhaseTimeConfig = PhaseTimeConfig(45, 0, 45)
)

data class PhaseTimeConfig(
    val baseDuration: Int,
    val perPlayerBonus: Int,
    val maxDuration: Int
)

data class DefenseConfig(
    val duration: Int,
    val questionsAllowed: Int,
    val questionTime: Int
)

data class ScoringConfig(
    val targetPoints: Int = 10,
    val liarSurvivalBonus: Int = 6,
    val correctVoteReward: Int = 3,
    val wrongEliminationPenalty: Int = -1,
    val topicGuessBonus: Int = 3
)

data class BalanceConfig(
    val minPlayers: Int = 4,
    val maxPlayers: Int = 8,
    val liarCount: Int = 1,
    val maxRounds: Int = 8
)
```

This technical implementation guide provides the concrete code structure needed to implement the complete game flow mechanics within the existing Liar Game architecture. The system maintains the current WebSocket-based real-time communication while adding sophisticated game flow management, scoring systems, and player progression tracking.

Key implementation highlights:
- **Modular Services**: Separate concerns between game flow, scoring, and timing
- **Real-time Updates**: WebSocket integration for immediate game state synchronization  
- **Flexible Configuration**: Properties-based balance tuning
- **Enhanced State Management**: Comprehensive game and player state tracking
- **Frontend Integration**: React components that seamlessly integrate with existing UI patterns

The implementation maintains backward compatibility while significantly enhancing the game experience with proper progression mechanics and satisfying conclusion flows.