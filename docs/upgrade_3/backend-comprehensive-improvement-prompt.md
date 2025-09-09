# 라이어 게임 백엔드 종합 개선 프롬프트

## 🏗️ 프로젝트 아키텍처 개요

이 프로젝트는 **Domain-Driven Design (DDD)** 패턴을 따르는 Kotlin/Spring Boot 애플리케이션입니다. 실시간 채팅 기반 라이어 게임을 위한 견고한 백엔드 아키텍처가 구축되어 있지만, `agent_order.md`의 요구사항을 완전히 충족하기 위해 추가 개발이 필요합니다.

### 현재 아키텍처 구조
```
kotlin_liargame/
├── domain/                    # 비즈니스 도메인
│   ├── auth/                 # 인증 & 관리자
│   ├── chat/                 # 실시간 채팅 시스템  
│   ├── game/                 # 핵심 게임 메커니즘
│   ├── profanity/            # 콘텐츠 조정
│   ├── subject/              # 게임 주제 관리
│   ├── user/                 # 사용자 관리
│   └── word/                 # 단어/콘텐츠 검증
├── global/                   # 교차 관심사
│   ├── config/               # Spring 설정
│   ├── security/             # 보안 & 속도 제한
│   ├── messaging/            # WebSocket 메시징
│   ├── redis/               # 분산 상태 관리
│   └── util/                # 공통 유틸리티
└── tools/                   # 인프라 도구
    ├── websocket/           # 실시간 통신
    ├── scheduler/           # 백그라운드 작업
    └── swagger/             # API 문서화
```

### 현재 구현된 주요 기능들
- ✅ 게임방 생성/참여/나가기 시스템
- ✅ WebSocket 기반 실시간 통신
- ✅ 방장 권한 관리 및 자동 이양
- ✅ 플레이어 연결 상태 추적
- ✅ 투표 시스템 및 게임 진행 관리
- ✅ Redis 기반 세션 및 상태 관리
- ✅ 보안 및 속도 제한
- ✅ 욕설 필터링 시스템

---

## 🔴 Critical Priority - 백엔드 구현 사항

### 1. 플레이어 준비 상태 시스템

**새로 구현할 엔티티:**
```kotlin
// domain/game/model/PlayerReadinessEntity.kt
@Entity
@Table(name = "player_readiness")
data class PlayerReadinessEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    val game: GameEntity,
    
    @Column(name = "user_id")
    val userId: Long,
    
    @Column(name = "nickname")
    val nickname: String,
    
    @Column(name = "is_ready")
    var isReady: Boolean = false,
    
    @Column(name = "ready_at")
    var readyAt: Instant? = null,
    
    @Column(name = "updated_at")
    var updatedAt: Instant = Instant.now()
)
```

**새로운 Repository:**
```kotlin
// domain/game/repository/PlayerReadinessRepository.kt
@Repository
interface PlayerReadinessRepository : JpaRepository<PlayerReadinessEntity, Long> {
    fun findByGame(game: GameEntity): List<PlayerReadinessEntity>
    fun findByGameAndUserId(game: GameEntity, userId: Long): PlayerReadinessEntity?
    fun deleteByGame(game: GameEntity)
    fun countByGameAndIsReady(game: GameEntity, isReady: Boolean): Int
}
```

**새로운 서비스:**
```kotlin
// domain/game/service/PlayerReadinessService.kt
@Service
@Transactional
class PlayerReadinessService(
    private val playerReadinessRepository: PlayerReadinessRepository,
    private val gameRepository: GameRepository,
    private val sessionService: SessionService,
    private val gameMonitoringService: GameMonitoringService
) {
    
    fun togglePlayerReady(gameNumber: Int, session: HttpSession): PlayerReadyResponse {
        val game = gameRepository.findByGameNumber(gameNumber) 
            ?: throw GameNotFoundException(gameNumber)
        
        if (game.gameState != GameState.WAITING) {
            throw IllegalStateException("게임이 대기 상태가 아닙니다.")
        }
        
        val userId = sessionService.getCurrentUserId(session)
        val nickname = sessionService.getCurrentUserNickname(session)
        
        val readiness = playerReadinessRepository.findByGameAndUserId(game, userId)
            ?: PlayerReadinessEntity(
                game = game,
                userId = userId,
                nickname = nickname
            )
        
        readiness.isReady = !readiness.isReady
        readiness.readyAt = if (readiness.isReady) Instant.now() else null
        readiness.updatedAt = Instant.now()
        
        playerReadinessRepository.save(readiness)
        
        // 모든 플레이어가 준비되었는지 확인
        val readyCount = playerReadinessRepository.countByGameAndIsReady(game, true)
        val totalPlayers = playerReadinessRepository.findByGame(game).size
        val allReady = readyCount == totalPlayers && totalPlayers >= game.minPlayers
        
        // WebSocket으로 모든 플레이어에게 준비 상태 변경 알림
        gameMonitoringService.notifyPlayerReadyStateChanged(game, readiness, allReady)
        
        return PlayerReadyResponse(
            playerId = userId,
            nickname = nickname,
            isReady = readiness.isReady,
            allPlayersReady = allReady,
            readyCount = readyCount,
            totalPlayers = totalPlayers
        )
    }
    
    fun getAllReadyStates(gameNumber: Int): List<PlayerReadyResponse> {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)
        
        return playerReadinessRepository.findByGame(game).map { readiness ->
            PlayerReadyResponse(
                playerId = readiness.userId,
                nickname = readiness.nickname,
                isReady = readiness.isReady,
                allPlayersReady = false, // 개별 조회에서는 false
                readyCount = 0,
                totalPlayers = 0
            )
        }
    }
}
```

### 2. 게임 시작 카운트다운 시스템

**GameEntity에 추가할 필드:**
```kotlin
// domain/game/model/GameEntity.kt에 추가
@Column(name = "countdown_started_at")
var countdownStartedAt: Instant? = null

@Column(name = "countdown_end_time")
var countdownEndTime: Instant? = null

@Column(name = "countdown_duration_seconds")
var countdownDurationSeconds: Int = 10

@Column(name = "min_players")
var minPlayers: Int = 3

@Column(name = "max_players") 
var maxPlayers: Int = 15
```

**새로운 카운트다운 서비스:**
```kotlin
// domain/game/service/GameCountdownService.kt
@Service
@Transactional
class GameCountdownService(
    private val gameRepository: GameRepository,
    private val playerReadinessService: PlayerReadinessService,
    private val sessionService: SessionService,
    private val gameMonitoringService: GameMonitoringService,
    private val gameStartService: GameStartService,
    private val taskScheduler: TaskScheduler
) {
    
    private val activeCountdowns = mutableMapOf<Int, ScheduledFuture<*>>()
    
    fun startCountdown(gameNumber: Int, session: HttpSession): CountdownResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)
        
        val userId = sessionService.getCurrentUserId(session)
        val nickname = sessionService.getCurrentUserNickname(session)
        
        if (game.gameOwner != nickname) {
            throw IllegalStateException("방장만 게임을 시작할 수 있습니다.")
        }
        
        if (game.gameState != GameState.WAITING) {
            throw IllegalStateException("게임이 대기 상태가 아닙니다.")
        }
        
        // 모든 플레이어가 준비되었는지 확인
        val readyStates = playerReadinessService.getAllReadyStates(gameNumber)
        val allReady = readyStates.all { it.isReady } && readyStates.size >= game.minPlayers
        
        if (!allReady) {
            throw IllegalStateException("모든 플레이어가 준비되지 않았거나 최소 인원이 부족합니다.")
        }
        
        // 기존 카운트다운이 있으면 취소
        cancelCountdown(gameNumber)
        
        // 카운트다운 시작
        val countdownEndTime = Instant.now().plusSeconds(game.countdownDurationSeconds.toLong())
        game.countdownStartedAt = Instant.now()
        game.countdownEndTime = countdownEndTime
        gameRepository.save(game)
        
        // 자동 게임 시작 스케줄링
        val scheduledTask = taskScheduler.schedule({
            try {
                gameStartService.autoStartGame(gameNumber)
            } catch (e: Exception) {
                logger.error("Auto start failed for game $gameNumber", e)
            }
        }, countdownEndTime)
        
        activeCountdowns[gameNumber] = scheduledTask
        
        // 모든 플레이어에게 카운트다운 시작 알림
        gameMonitoringService.notifyCountdownStarted(game, countdownEndTime)
        
        return CountdownResponse(
            gameNumber = gameNumber,
            countdownEndTime = countdownEndTime,
            durationSeconds = game.countdownDurationSeconds,
            canCancel = true
        )
    }
    
    fun cancelCountdown(gameNumber: Int): CountdownResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)
        
        // 스케줄된 작업 취소
        activeCountdowns[gameNumber]?.cancel(true)
        activeCountdowns.remove(gameNumber)
        
        // 카운트다운 취소
        game.countdownStartedAt = null
        game.countdownEndTime = null
        gameRepository.save(game)
        
        // 모든 플레이어에게 카운트다운 취소 알림
        gameMonitoringService.notifyCountdownCancelled(game)
        
        return CountdownResponse(
            gameNumber = gameNumber,
            countdownEndTime = null,
            durationSeconds = 0,
            canCancel = false
        )
    }
    
    fun getCountdownStatus(gameNumber: Int): CountdownResponse? {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return null
        
        return if (game.countdownEndTime != null && game.countdownStartedAt != null) {
            val remaining = Duration.between(Instant.now(), game.countdownEndTime).seconds.toInt()
            CountdownResponse(
                gameNumber = gameNumber,
                countdownEndTime = game.countdownEndTime,
                durationSeconds = remaining.coerceAtLeast(0),
                canCancel = remaining > 0
            )
        } else {
            null
        }
    }
}
```

### 3. 향상된 연결 관리 시스템

**새로운 연결 추적 엔티티:**
```kotlin
// global/connection/model/ConnectionLogEntity.kt
@Entity
@Table(name = "connection_logs")
data class ConnectionLogEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(name = "user_id")
    val userId: Long,
    
    @Column(name = "game_id")
    val gameId: Long?,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "action")
    val action: ConnectionAction,
    
    @Column(name = "timestamp")
    val timestamp: Instant = Instant.now(),
    
    @Column(name = "session_id")
    val sessionId: String?,
    
    @Column(name = "grace_period_seconds")
    val gracePeriodSeconds: Int = 30
)

enum class ConnectionAction {
    CONNECT, DISCONNECT, RECONNECT, GRACE_PERIOD_STARTED, GRACE_PERIOD_EXPIRED
}
```

**새로운 연결 관리 서비스:**
```kotlin
// global/connection/service/EnhancedConnectionService.kt
@Service
@Transactional
class EnhancedConnectionService(
    private val connectionLogRepository: ConnectionLogRepository,
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val gameMonitoringService: GameMonitoringService,
    private val taskScheduler: TaskScheduler
) {
    
    private val gracePeriodsMap = mutableMapOf<Long, ScheduledFuture<*>>()
    
    fun handleDisconnection(userId: Long, gameNumber: Int) {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return
        val player = playerRepository.findByGameAndUserId(game, userId) ?: return
        
        // 연결 해제 로그 기록
        connectionLogRepository.save(ConnectionLogEntity(
            userId = userId,
            gameId = game.id,
            action = ConnectionAction.DISCONNECT,
            sessionId = null
        ))
        
        // 게임 진행 중이면 유예 시간 시작
        if (game.gameState == GameState.IN_PROGRESS) {
            startGracePeriod(userId, gameNumber)
        } else {
            // 대기 중이면 즉시 제거
            handlePlayerRemoval(userId, gameNumber, "게임 대기 중 연결 해제")
        }
        
        gameMonitoringService.notifyPlayerDisconnected(game, player, hasGracePeriod = game.gameState == GameState.IN_PROGRESS)
    }
    
    fun handleReconnection(userId: Long, gameNumber: Int) {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return
        val player = playerRepository.findByGameAndUserId(game, userId) ?: return
        
        // 유예 시간 취소
        gracePeriodsMap[userId]?.cancel(true)
        gracePeriodsMap.remove(userId)
        
        // 재연결 로그 기록
        connectionLogRepository.save(ConnectionLogEntity(
            userId = userId,
            gameId = game.id,
            action = ConnectionAction.RECONNECT
        ))
        
        gameMonitoringService.notifyPlayerReconnected(game, player)
    }
    
    private fun startGracePeriod(userId: Long, gameNumber: Int) {
        val gracePeriodSeconds = 30L
        
        connectionLogRepository.save(ConnectionLogEntity(
            userId = userId,
            gameId = gameRepository.findByGameNumber(gameNumber)?.id,
            action = ConnectionAction.GRACE_PERIOD_STARTED,
            gracePeriodSeconds = gracePeriodSeconds.toInt()
        ))
        
        val graceTask = taskScheduler.schedule({
            handleGracePeriodExpired(userId, gameNumber)
        }, Instant.now().plusSeconds(gracePeriodSeconds))
        
        gracePeriodsMap[userId] = graceTask
    }
    
    private fun handleGracePeriodExpired(userId: Long, gameNumber: Int) {
        gracePeriodsMap.remove(userId)
        
        connectionLogRepository.save(ConnectionLogEntity(
            userId = userId,
            gameId = gameRepository.findByGameNumber(gameNumber)?.id,
            action = ConnectionAction.GRACE_PERIOD_EXPIRED
        ))
        
        handlePlayerRemoval(userId, gameNumber, "유예 시간 만료")
    }
    
    private fun handlePlayerRemoval(userId: Long, gameNumber: Int, reason: String) {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return
        
        // 플레이어 제거 전 최소 인원 체크
        val currentPlayers = playerRepository.findByGame(game).filter { it.isAlive }
        
        if (currentPlayers.size <= 2) {
            // 최소 인원 미달로 게임 종료
            game.gameState = GameState.ENDED
            game.endReason = "최소 인원 미달"
            gameRepository.save(game)
            gameMonitoringService.notifyGameEndedByMinPlayers(game, reason)
        } else {
            // 플레이어만 제거
            val player = playerRepository.findByGameAndUserId(game, userId)
            if (player != null) {
                // 라이어인 경우 특별 처리
                if (player.role == PlayerRole.LIAR) {
                    handleLiarDisconnection(game, player, reason)
                } else {
                    // 일반 플레이어 제거
                    removePlayerFromGame(game, player, reason)
                }
            }
        }
    }
    
    private fun handleLiarDisconnection(game: GameEntity, liarPlayer: PlayerEntity, reason: String) {
        // 라이어 퇴장에 대한 긴급 투표 시작 또는 즉시 게임 종료
        game.gameState = GameState.ENDED
        game.endReason = "라이어 연결 해제: $reason"
        game.winningTeam = WinningTeam.CITIZENS
        gameRepository.save(game)
        
        gameMonitoringService.notifyGameEndedByLiarDisconnection(game, liarPlayer, reason)
    }
    
    fun getConnectionStatus(gameNumber: Int): List<PlayerConnectionStatus> {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return emptyList()
        val players = playerRepository.findByGame(game)
        
        return players.map { player ->
            val hasActiveGracePeriod = gracePeriodsMap.containsKey(player.userId)
            val lastConnection = connectionLogRepository.findTopByUserIdOrderByTimestampDesc(player.userId)
            
            PlayerConnectionStatus(
                userId = player.userId,
                nickname = player.nickname,
                isConnected = !hasActiveGracePeriod && lastConnection?.action != ConnectionAction.DISCONNECT,
                hasGracePeriod = hasActiveGracePeriod,
                lastSeenAt = lastConnection?.timestamp ?: Instant.now(),
                connectionStability = calculateConnectionStability(player.userId)
            )
        }
    }
    
    private fun calculateConnectionStability(userId: Long): ConnectionStability {
        val recentLogs = connectionLogRepository.findByUserIdAndTimestampAfter(
            userId, 
            Instant.now().minus(Duration.ofHours(1))
        )
        
        val disconnectCount = recentLogs.count { it.action == ConnectionAction.DISCONNECT }
        
        return when {
            disconnectCount == 0 -> ConnectionStability.STABLE
            disconnectCount < 3 -> ConnectionStability.UNSTABLE
            else -> ConnectionStability.POOR
        }
    }
}

enum class ConnectionStability {
    STABLE, UNSTABLE, POOR
}
```

### 4. 동적 투표 조정 시스템

**GameEntity에 추가할 필드:**
```kotlin
@Column(name = "required_votes")
var requiredVotes: Int? = null

@Column(name = "current_votes")
var currentVotes: Int = 0

@Column(name = "active_players_count")
var activePlayersCount: Int = 0

@Column(name = "voting_phase")
@Enumerated(EnumType.STRING)
var votingPhase: VotingPhase? = null

enum class VotingPhase {
    LIAR_ELIMINATION, // 라이어 찾기 투표
    SURVIVAL_VOTE,    // 생존 투표 (방어 후)
    TIE_BREAKER      // 동점 결정
}
```

**향상된 투표 서비스:**
```kotlin
// domain/game/service/EnhancedVotingService.kt
@Service
@Transactional
class EnhancedVotingService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val sessionService: SessionService,
    private val gameMonitoringService: GameMonitoringService,
    private val tieBreakerService: TieBreakerService
) {
    
    fun submitVote(gameNumber: Int, targetPlayerId: Long, session: HttpSession): VoteResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)
        
        val userId = sessionService.getCurrentUserId(session)
        val voter = playerRepository.findByGameAndUserId(game, userId)
            ?: throw PlayerNotInGameException(userId, gameNumber)
        
        if (!voter.isAlive) {
            throw IllegalStateException("탈락한 플레이어는 투표할 수 없습니다.")
        }
        
        // 현재 활성 플레이어 수 계산 및 업데이트
        val activePlayers = playerRepository.findByGame(game).filter { it.isAlive }
        game.activePlayersCount = activePlayers.size
        
        // 필요한 투표 수 동적 계산
        game.requiredVotes = calculateRequiredVotes(activePlayers.size, game.votingPhase)
        
        // 기존 투표 취소 (투표 변경 허용)
        if (voter.votedFor != null) {
            game.currentVotes = maxOf(0, game.currentVotes - 1)
        }
        
        // 새 투표 설정
        voter.votedFor = targetPlayerId
        voter.state = PlayerState.VOTED
        voter.votedAt = Instant.now()
        playerRepository.save(voter)
        
        // 현재 투표 수 업데이트
        game.currentVotes = activePlayers.count { it.votedFor != null }
        gameRepository.save(game)
        
        // 실시간 투표 현황 알림
        gameMonitoringService.notifyVoteSubmitted(game, voter, targetPlayerId, game.currentVotes, game.requiredVotes!!)
        
        // 투표 완료 확인
        if (game.currentVotes >= game.requiredVotes!!) {
            processVotingResult(game, activePlayers)
        }
        
        return VoteResponse(
            gameNumber = gameNumber,
            voterNickname = voter.nickname,
            targetPlayerId = targetPlayerId,
            currentVotes = game.currentVotes,
            requiredVotes = game.requiredVotes!!,
            votingComplete = game.currentVotes >= game.requiredVotes!!,
            votingDeadline = game.phaseEndTime?.toString()
        )
    }
    
    private fun calculateRequiredVotes(activePlayerCount: Int, votingPhase: VotingPhase?): Int {
        return when (votingPhase) {
            VotingPhase.LIAR_ELIMINATION -> (activePlayerCount * 0.6).toInt().coerceAtLeast(1) // 60% 이상
            VotingPhase.SURVIVAL_VOTE -> (activePlayerCount / 2) + 1 // 과반수
            VotingPhase.TIE_BREAKER -> activePlayerCount // 전원 투표
            null -> (activePlayerCount / 2) + 1 // 기본값: 과반수
        }
    }
    
    private fun processVotingResult(game: GameEntity, players: List<PlayerEntity>) {
        val voteResults = players
            .filter { it.votedFor != null }
            .groupBy { it.votedFor }
            .mapValues { it.value.size }
            .toList()
            .sortedByDescending { it.second }
        
        if (voteResults.isEmpty()) {
            // 투표 결과가 없으면 게임 계속
            gameMonitoringService.notifyVotingFailed(game, "투표 결과가 없습니다.")
            return
        }
        
        val maxVotes = voteResults.first().second
        val topCandidates = voteResults.filter { it.second == maxVotes }
        
        when {
            topCandidates.size == 1 -> {
                // 명확한 승자
                val eliminatedPlayerId = topCandidates.first().first!!
                handlePlayerElimination(game, eliminatedPlayerId)
            }
            topCandidates.size > 1 -> {
                // 동점 상황 - 타이브레이커 필요
                val tiedPlayerIds = topCandidates.map { it.first!! }
                tieBreakerService.startTieBreaker(game, tiedPlayerIds)
            }
        }
    }
    
    private fun handlePlayerElimination(game: GameEntity, eliminatedPlayerId: Long) {
        val eliminatedPlayer = playerRepository.findByGameAndUserId(game, eliminatedPlayerId)
            ?: return
        
        eliminatedPlayer.isAlive = false
        eliminatedPlayer.eliminatedAt = Instant.now()
        playerRepository.save(eliminatedPlayer)
        
        // 라이어가 제거되었는지 확인
        if (eliminatedPlayer.role == PlayerRole.LIAR) {
            // 시민 승리
            game.gameState = GameState.ENDED
            game.winningTeam = WinningTeam.CITIZENS
            game.endReason = "라이어 제거"
        } else {
            // 시민이 제거됨 - 게임 계속 또는 라이어 승리 확인
            val remainingCitizens = playerRepository.findByGame(game)
                .filter { it.isAlive && it.role == PlayerRole.CITIZEN }
            val remainingLiars = playerRepository.findByGame(game)
                .filter { it.isAlive && it.role == PlayerRole.LIAR }
            
            if (remainingLiars.size >= remainingCitizens.size) {
                // 라이어 승리
                game.gameState = GameState.ENDED
                game.winningTeam = WinningTeam.LIARS
                game.endReason = "라이어 수가 시민 수와 같거나 많음"
            }
        }
        
        gameRepository.save(game)
        gameMonitoringService.notifyPlayerEliminated(game, eliminatedPlayer)
        
        if (game.gameState == GameState.ENDED) {
            gameMonitoringService.notifyGameEnded(game)
        }
    }
    
    fun getVotingStatus(gameNumber: Int): VotingStatusResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)
        
        val players = playerRepository.findByGame(game).filter { it.isAlive }
        val votedPlayers = players.filter { it.votedFor != null }
        val pendingPlayers = players.filter { it.votedFor == null }
        
        return VotingStatusResponse(
            gameNumber = gameNumber,
            currentVotes = game.currentVotes,
            requiredVotes = game.requiredVotes ?: 0,
            totalPlayers = game.activePlayersCount,
            votedPlayers = votedPlayers.map { PlayerVoteInfo(it.userId, it.nickname, it.votedAt) },
            pendingPlayers = pendingPlayers.map { PlayerVoteInfo(it.userId, it.nickname, null) },
            votingDeadline = game.phaseEndTime?.toString(),
            canChangeVote = true
        )
    }
}
```

---

## 🟡 High Priority - 백엔드 구현 사항

### 5. 타이브레이커 시스템

**새로운 타이브레이커 엔티티:**
```kotlin
// domain/game/model/TieBreakerEntity.kt
@Entity
@Table(name = "tie_breaker")
data class TieBreakerEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    val game: GameEntity,
    
    @Column(name = "tied_player_ids", columnDefinition = "TEXT")
    val tiedPlayerIds: String, // JSON array of player IDs
    
    @Enumerated(EnumType.STRING)
    @Column(name = "method")
    val method: TieBreakerMethod,
    
    @Column(name = "start_time")
    val startTime: Instant,
    
    @Column(name = "end_time")
    var endTime: Instant? = null,
    
    @Column(name = "winner_id")
    var winnerId: Long? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    var status: TieBreakerStatus = TieBreakerStatus.ACTIVE,
    
    @Column(name = "time_limit_seconds")
    val timeLimitSeconds: Int = 30
)

enum class TieBreakerMethod {
    OWNER_DECISION,   // 방장이 결정
    SUDDEN_DEATH,     // 서든데스 라운드
    RANDOM_SELECTION, // 랜덤 선택
    REVOTE           // 재투표
}

enum class TieBreakerStatus {
    ACTIVE, COMPLETED, CANCELLED, TIMEOUT
}
```

**타이브레이커 서비스:**
```kotlin
// domain/game/service/TieBreakerService.kt
@Service
@Transactional
class TieBreakerService(
    private val tieBreakerRepository: TieBreakerRepository,
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val gameMonitoringService: GameMonitoringService,
    private val taskScheduler: TaskScheduler,
    private val objectMapper: ObjectMapper
) {
    
    private val activeTieBreakers = mutableMapOf<Long, ScheduledFuture<*>>()
    
    fun startTieBreaker(game: GameEntity, tiedPlayerIds: List<Long>): TieBreakerResponse {
        val method = determineTieBreakerMethod(game, tiedPlayerIds)
        val timeLimitSeconds = getTimeLimitForMethod(method)
        
        val tieBreaker = TieBreakerEntity(
            game = game,
            tiedPlayerIds = objectMapper.writeValueAsString(tiedPlayerIds),
            method = method,
            startTime = Instant.now(),
            timeLimitSeconds = timeLimitSeconds
        )
        
        val savedTieBreaker = tieBreakerRepository.save(tieBreaker)
        
        // 시간 제한 스케줄링
        val timeoutTask = taskScheduler.schedule({
            handleTieBreakerTimeout(savedTieBreaker.id)
        }, Instant.now().plusSeconds(timeLimitSeconds.toLong()))
        
        activeTieBreakers[savedTieBreaker.id] = timeoutTask
        
        // 방법별 처리
        return when (method) {
            TieBreakerMethod.OWNER_DECISION -> {
                gameMonitoringService.notifyOwnerDecisionRequired(game, tiedPlayerIds, timeLimitSeconds)
                TieBreakerResponse(
                    id = savedTieBreaker.id,
                    method = method,
                    timeLimit = timeLimitSeconds,
                    tiedPlayers = getPlayerInfos(game, tiedPlayerIds),
                    status = TieBreakerStatus.ACTIVE
                )
            }
            TieBreakerMethod.SUDDEN_DEATH -> {
                startSuddenDeathRound(game, tiedPlayerIds, savedTieBreaker)
                TieBreakerResponse(
                    id = savedTieBreaker.id,
                    method = method,
                    timeLimit = timeLimitSeconds,
                    tiedPlayers = getPlayerInfos(game, tiedPlayerIds),
                    status = TieBreakerStatus.ACTIVE
                )
            }
            TieBreakerMethod.REVOTE -> {
                startRevote(game, tiedPlayerIds, savedTieBreaker)
                TieBreakerResponse(
                    id = savedTieBreaker.id,
                    method = method,
                    timeLimit = timeLimitSeconds,
                    tiedPlayers = getPlayerInfos(game, tiedPlayerIds),
                    status = TieBreakerStatus.ACTIVE
                )
            }
            TieBreakerMethod.RANDOM_SELECTION -> {
                val winner = tiedPlayerIds.random()
                savedTieBreaker.winnerId = winner
                savedTieBreaker.status = TieBreakerStatus.COMPLETED
                savedTieBreaker.endTime = Instant.now()
                tieBreakerRepository.save(savedTieBreaker)
                
                completeTieBreaker(savedTieBreaker, winner)
                
                TieBreakerResponse(
                    id = savedTieBreaker.id,
                    method = method,
                    winner = getPlayerInfo(game, winner),
                    tiedPlayers = getPlayerInfos(game, tiedPlayerIds),
                    status = TieBreakerStatus.COMPLETED
                )
            }
        }
    }
    
    fun submitOwnerDecision(tieBreakererId: Long, winnerId: Long, session: HttpSession): TieBreakerResponse {
        val tieBreaker = tieBreakerRepository.findById(tieBreakererId).orElse(null)
            ?: throw IllegalArgumentException("타이브레이커를 찾을 수 없습니다.")
        
        if (tieBreaker.status != TieBreakerStatus.ACTIVE) {
            throw IllegalStateException("이미 완료되거나 취소된 타이브레이커입니다.")
        }
        
        if (tieBreaker.method != TieBreakerMethod.OWNER_DECISION) {
            throw IllegalStateException("방장 결정 방식이 아닙니다.")
        }
        
        val userId = sessionService.getCurrentUserId(session)
        val nickname = sessionService.getCurrentUserNickname(session)
        
        if (tieBreaker.game.gameOwner != nickname) {
            throw IllegalArgumentException("방장만 결정할 수 있습니다.")
        }
        
        val tiedPlayerIds = objectMapper.readValue(tieBreaker.tiedPlayerIds, Array<Long>::class.java).toList()
        if (!tiedPlayerIds.contains(winnerId)) {
            throw IllegalArgumentException("동점 플레이어 중에서만 선택할 수 있습니다.")
        }
        
        tieBreaker.winnerId = winnerId
        tieBreaker.status = TieBreakerStatus.COMPLETED
        tieBreaker.endTime = Instant.now()
        tieBreakerRepository.save(tieBreaker)
        
        completeTieBreaker(tieBreaker, winnerId)
        
        return TieBreakerResponse(
            id = tieBreaker.id,
            method = tieBreaker.method,
            winner = getPlayerInfo(tieBreaker.game, winnerId),
            tiedPlayers = getPlayerInfos(tieBreaker.game, tiedPlayerIds),
            status = TieBreakerStatus.COMPLETED
        )
    }
    
    private fun determineTieBreakerMethod(game: GameEntity, tiedPlayerIds: List<Long>): TieBreakerMethod {
        return when {
            tiedPlayerIds.size == 2 -> TieBreakerMethod.OWNER_DECISION
            tiedPlayerIds.size <= 3 -> TieBreakerMethod.REVOTE
            else -> TieBreakerMethod.RANDOM_SELECTION
        }
    }
    
    private fun getTimeLimitForMethod(method: TieBreakerMethod): Int {
        return when (method) {
            TieBreakerMethod.OWNER_DECISION -> 30
            TieBreakerMethod.SUDDEN_DEATH -> 60
            TieBreakerMethod.REVOTE -> 45
            TieBreakerMethod.RANDOM_SELECTION -> 0
        }
    }
    
    private fun completeTieBreaker(tieBreaker: TieBreakerEntity, winnerId: Long) {
        // 스케줄된 작업 취소
        activeTieBreakers[tieBreaker.id]?.cancel(true)
        activeTieBreakers.remove(tieBreaker.id)
        
        // 승자를 제외한 나머지 플레이어들 제거
        val tiedPlayerIds = objectMapper.readValue(tieBreaker.tiedPlayerIds, Array<Long>::class.java).toList()
        val losers = tiedPlayerIds.filter { it != winnerId }
        
        losers.forEach { loserId ->
            val loser = playerRepository.findByGameAndUserId(tieBreaker.game, loserId)
            loser?.let {
                it.isAlive = false
                it.eliminatedAt = Instant.now()
                it.eliminationReason = "타이브레이커 패배"
                playerRepository.save(it)
            }
        }
        
        gameMonitoringService.notifyTieBreakerCompleted(tieBreaker.game, winnerId, losers)
        
        // 게임 종료 조건 확인
        checkGameEndConditions(tieBreaker.game)
    }
    
    private fun handleTieBreakerTimeout(tieBreakererId: Long) {
        val tieBreaker = tieBreakerRepository.findById(tieBreakererId).orElse(null) ?: return
        
        if (tieBreaker.status != TieBreakerStatus.ACTIVE) return
        
        tieBreaker.status = TieBreakerStatus.TIMEOUT
        tieBreaker.endTime = Instant.now()
        
        // 타임아웃 시 랜덤 선택
        val tiedPlayerIds = objectMapper.readValue(tieBreaker.tiedPlayerIds, Array<Long>::class.java).toList()
        val randomWinner = tiedPlayerIds.random()
        tieBreaker.winnerId = randomWinner
        
        tieBreakerRepository.save(tieBreaker)
        
        gameMonitoringService.notifyTieBreakerTimeout(tieBreaker.game, randomWinner)
        completeTieBreaker(tieBreaker, randomWinner)
    }
}
```

### 6. 세션 코드 보안 강화

**새로운 보안 세션 서비스:**
```kotlin
// global/security/service/SecureSessionService.kt
@Service
class SecureSessionService(
    private val gameRepository: GameRepository,
    private val aesUtil: AESUtil
) {
    
    fun generateSecureSessionCode(gameNumber: Int): String {
        val timestamp = System.currentTimeMillis()
        val randomSalt = generateRandomString(8)
        val payload = "$gameNumber:$timestamp:$randomSalt"
        
        return aesUtil.encrypt(payload)
    }
    
    fun validateSessionCode(sessionCode: String): SessionValidationResult {
        try {
            val decrypted = aesUtil.decrypt(sessionCode)
            val parts = decrypted.split(":")
            
            if (parts.size != 3) {
                return SessionValidationResult.INVALID_FORMAT
            }
            
            val gameNumber = parts[0].toInt()
            val timestamp = parts[1].toLong()
            
            // 2시간 만료 체크
            val expirationTime = timestamp + (2 * 60 * 60 * 1000)
            if (System.currentTimeMillis() > expirationTime) {
                return SessionValidationResult.EXPIRED
            }
            
            // 게임 존재 여부 확인
            val game = gameRepository.findByGameNumber(gameNumber)
            if (game == null || game.gameState == GameState.ENDED) {
                return SessionValidationResult.GAME_NOT_FOUND
            }
            
            return SessionValidationResult.VALID(gameNumber)
        } catch (e: Exception) {
            return SessionValidationResult.INVALID_FORMAT
        }
    }
    
    fun generateShareableCode(gameNumber: Int, requesterId: Long): String? {
        val game = gameRepository.findByGameNumber(gameNumber) ?: return null
        
        // 방 내부 플레이어만 공유 코드 생성 가능
        val requester = playerRepository.findByGameAndUserId(game, requesterId) ?: return null
        
        if (game.gameState != GameState.WAITING) {
            return null // 대기 중인 게임에서만 공유 가능
        }
        
        val shareablePayload = "SHARE:$gameNumber:${System.currentTimeMillis()}:${requesterId}"
        return aesUtil.encrypt(shareablePayload)
    }
    
    fun validateShareableCode(shareCode: String): ShareCodeValidationResult {
        try {
            val decrypted = aesUtil.decrypt(shareCode)
            val parts = decrypted.split(":")
            
            if (parts.size != 4 || parts[0] != "SHARE") {
                return ShareCodeValidationResult.INVALID_FORMAT
            }
            
            val gameNumber = parts[1].toInt()
            val timestamp = parts[2].toLong()
            val sharerId = parts[3].toLong()
            
            // 1시간 만료 체크 (공유 코드는 더 짧은 유효 기간)
            val expirationTime = timestamp + (60 * 60 * 1000)
            if (System.currentTimeMillis() > expirationTime) {
                return ShareCodeValidationResult.EXPIRED
            }
            
            val game = gameRepository.findByGameNumber(gameNumber)
            if (game == null || game.gameState != GameState.WAITING) {
                return ShareCodeValidationResult.GAME_NOT_AVAILABLE
            }
            
            // 공유한 플레이어가 여전히 게임에 있는지 확인
            val sharer = playerRepository.findByGameAndUserId(game, sharerId)
            if (sharer == null) {
                return ShareCodeValidationResult.SHARER_NOT_IN_GAME
            }
            
            return ShareCodeValidationResult.VALID(gameNumber, sharerId)
        } catch (e: Exception) {
            return ShareCodeValidationResult.INVALID_FORMAT
        }
    }
    
    private fun generateRandomString(length: Int): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        return (1..length)
            .map { chars.random() }
            .joinToString("")
    }
}

sealed class SessionValidationResult {
    object INVALID_FORMAT : SessionValidationResult()
    object EXPIRED : SessionValidationResult()
    object GAME_NOT_FOUND : SessionValidationResult()
    data class VALID(val gameNumber: Int) : SessionValidationResult()
}

sealed class ShareCodeValidationResult {
    object INVALID_FORMAT : ShareCodeValidationResult()
    object EXPIRED : ShareCodeValidationResult()
    object GAME_NOT_AVAILABLE : ShareCodeValidationResult()
    object SHARER_NOT_IN_GAME : ShareCodeValidationResult()
    data class VALID(val gameNumber: Int, val sharerId: Long) : ShareCodeValidationResult()
}
```

### 7. 커뮤니티 콘텐츠 시스템

**새로운 커뮤니티 콘텐츠 엔티티:**
```kotlin
// domain/content/model/CommunitySubmissionEntity.kt
@Entity
@Table(name = "community_submissions")
data class CommunitySubmissionEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(name = "submitter_id")
    val submitterId: Long,
    
    @Column(name = "submitter_nickname")
    val submitterNickname: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "content_type")
    val contentType: SubmissionType,
    
    @Column(name = "content", length = 500)
    val content: String,
    
    @Column(name = "subject_id")
    val subjectId: Long?, // 답안 제출 시 연결될 주제 ID
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    var status: SubmissionStatus = SubmissionStatus.PENDING,
    
    @Column(name = "submitted_at")
    val submittedAt: Instant = Instant.now(),
    
    @Column(name = "reviewed_at")
    var reviewedAt: Instant? = null,
    
    @Column(name = "reviewed_by")
    var reviewedBy: Long? = null,
    
    @Column(name = "review_comment", length = 1000)
    var reviewComment: String? = null,
    
    @Column(name = "approval_votes")
    var approvalVotes: Int = 0,
    
    @Column(name = "rejection_votes")
    var rejectionVotes: Int = 0
)

enum class SubmissionType {
    SUBJECT, ANSWER
}

enum class SubmissionStatus {
    PENDING,     // 검토 대기
    APPROVED,    // 승인됨
    REJECTED,    // 거부됨
    DUPLICATE,   // 중복됨
    INAPPROPRIATE // 부적절함
}
```

**커뮤니티 콘텐츠 서비스:**
```kotlin
// domain/content/service/CommunityContentService.kt
@Service
@Transactional
class CommunityContentService(
    private val communitySubmissionRepository: CommunitySubmissionRepository,
    private val subjectRepository: SubjectRepository,
    private val wordRepository: WordRepository,
    private val sessionService: SessionService,
    private val profanityService: ProfanityService
) {
    
    fun submitContent(request: ContentSubmissionRequest, session: HttpSession): SubmissionResponse {
        val userId = sessionService.getCurrentUserId(session)
        val nickname = sessionService.getCurrentUserNickname(session)
        
        // 욕설 필터링
        if (profanityService.containsProfanity(request.content)) {
            throw IllegalArgumentException("부적절한 내용이 포함되어 있습니다.")
        }
        
        // 중복 확인
        val existingSubmission = communitySubmissionRepository.findByContentAndContentType(
            request.content, request.contentType
        )
        
        if (existingSubmission != null) {
            throw IllegalArgumentException("이미 제출된 내용입니다.")
        }
        
        // 기존 승인된 내용과 중복 확인
        when (request.contentType) {
            SubmissionType.SUBJECT -> {
                val existingSubject = subjectRepository.findByContent(request.content)
                if (existingSubject != null) {
                    throw IllegalArgumentException("이미 존재하는 주제입니다.")
                }
            }
            SubmissionType.ANSWER -> {
                if (request.subjectId == null) {
                    throw IllegalArgumentException("답안 제출 시 주제 ID가 필요합니다.")
                }
                
                val subject = subjectRepository.findById(request.subjectId).orElse(null)
                    ?: throw IllegalArgumentException("존재하지 않는 주제입니다.")
                
                val existingWord = wordRepository.findByContentAndSubject(request.content, subject)
                if (existingWord != null) {
                    throw IllegalArgumentException("이미 존재하는 답안입니다.")
                }
            }
        }
        
        // 제출 제한 확인 (하루 10개)
        val todaySubmissions = communitySubmissionRepository.countBySubmitterIdAndSubmittedAtAfter(
            userId, Instant.now().minus(Duration.ofDays(1))
        )
        
        if (todaySubmissions >= 10) {
            throw IllegalArgumentException("하루 제출 한도(10개)를 초과했습니다.")
        }
        
        val submission = CommunitySubmissionEntity(
            submitterId = userId,
            submitterNickname = nickname,
            contentType = request.contentType,
            content = request.content,
            subjectId = request.subjectId
        )
        
        val savedSubmission = communitySubmissionRepository.save(submission)
        
        return SubmissionResponse(
            id = savedSubmission.id,
            content = savedSubmission.content,
            contentType = savedSubmission.contentType,
            status = savedSubmission.status,
            submittedAt = savedSubmission.submittedAt
        )
    }
    
    fun batchSubmitContent(request: BatchContentRequest, session: HttpSession): BatchSubmissionResponse {
        val userId = sessionService.getCurrentUserId(session)
        val successfulSubmissions = mutableListOf<SubmissionResponse>()
        val failedSubmissions = mutableListOf<FailedSubmission>()
        
        request.items.forEach { item ->
            try {
                val submissionRequest = ContentSubmissionRequest(
                    contentType = item.contentType,
                    content = item.content,
                    subjectId = item.subjectId
                )
                
                val result = submitContent(submissionRequest, session)
                successfulSubmissions.add(result)
            } catch (e: Exception) {
                failedSubmissions.add(FailedSubmission(
                    content = item.content,
                    reason = e.message ?: "알 수 없는 오류"
                ))
            }
        }
        
        return BatchSubmissionResponse(
            successful = successfulSubmissions,
            failed = failedSubmissions,
            totalSubmitted = request.items.size
        )
    }
    
    fun getPendingSubmissions(page: Int, size: Int): Page<CommunitySubmissionEntity> {
        val pageable = PageRequest.of(page, size, Sort.by("submittedAt").ascending())
        return communitySubmissionRepository.findByStatus(SubmissionStatus.PENDING, pageable)
    }
    
    fun approveSubmission(submissionId: Long, session: HttpSession): ApprovalResponse {
        val reviewerId = sessionService.getCurrentUserId(session)
        val submission = communitySubmissionRepository.findById(submissionId).orElse(null)
            ?: throw IllegalArgumentException("존재하지 않는 제출물입니다.")
        
        if (submission.status != SubmissionStatus.PENDING) {
            throw IllegalStateException("이미 검토된 제출물입니다.")
        }
        
        // 실제 콘텐츠로 추가
        when (submission.contentType) {
            SubmissionType.SUBJECT -> {
                val newSubject = SubjectEntity(
                    content = submission.content,
                    status = org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED,
                    submittedBy = submission.submitterId
                )
                subjectRepository.save(newSubject)
            }
            SubmissionType.ANSWER -> {
                val subject = subjectRepository.findById(submission.subjectId!!).orElse(null)
                    ?: throw IllegalArgumentException("연결된 주제를 찾을 수 없습니다.")
                
                val newWord = org.example.kotlin_liargame.domain.word.model.WordEntity(
                    content = submission.content,
                    subject = subject,
                    status = org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED,
                    submittedBy = submission.submitterId
                )
                wordRepository.save(newWord)
            }
        }
        
        submission.status = SubmissionStatus.APPROVED
        submission.reviewedAt = Instant.now()
        submission.reviewedBy = reviewerId
        communitySubmissionRepository.save(submission)
        
        return ApprovalResponse(
            submissionId = submissionId,
            approved = true,
            content = submission.content
        )
    }
    
    fun rejectSubmission(submissionId: Long, reason: String, session: HttpSession): ApprovalResponse {
        val reviewerId = sessionService.getCurrentUserId(session)
        val submission = communitySubmissionRepository.findById(submissionId).orElse(null)
            ?: throw IllegalArgumentException("존재하지 않는 제출물입니다.")
        
        if (submission.status != SubmissionStatus.PENDING) {
            throw IllegalStateException("이미 검토된 제출물입니다.")
        }
        
        submission.status = SubmissionStatus.REJECTED
        submission.reviewedAt = Instant.now()
        submission.reviewedBy = reviewerId
        submission.reviewComment = reason
        communitySubmissionRepository.save(submission)
        
        return ApprovalResponse(
            submissionId = submissionId,
            approved = false,
            content = submission.content,
            reason = reason
        )
    }
}
```

---

## 🟢 Medium Priority - 백엔드 구현 사항

### 8. 신고 시스템 및 행동 추적

**플레이어 신고 엔티티:**
```kotlin
// domain/moderation/model/PlayerReportEntity.kt
@Entity
@Table(name = "player_reports")
data class PlayerReportEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(name = "reporter_user_id")
    val reporterUserId: Long,
    
    @Column(name = "reported_user_id")
    val reportedUserId: Long,
    
    @Column(name = "game_number")
    val gameNumber: Int,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "reason")
    val reason: ReportReason,
    
    @Column(name = "description", length = 500)
    val description: String?,
    
    @Column(name = "evidence", length = 2000)
    val evidence: String?, // JSON으로 증거 자료 저장
    
    @Column(name = "created_at")
    val createdAt: Instant = Instant.now(),
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    var status: ReportStatus = ReportStatus.PENDING,
    
    @Column(name = "reviewed_at")
    var reviewedAt: Instant? = null,
    
    @Column(name = "reviewed_by")
    var reviewedBy: Long? = null,
    
    @Column(name = "action_taken")
    var actionTaken: String? = null
)

enum class ReportReason {
    GRIEFING,              // 게임 방해
    INAPPROPRIATE_LANGUAGE, // 부적절한 언어
    CHEATING,              // 치팅/부정행위
    HARASSMENT,            // 괴롭힘
    LEAVING_GAME,          // 게임 중 이탈
    INAPPROPRIATE_CONTENT, // 부적절한 콘텐츠
    OTHER                  // 기타
}

enum class ReportStatus {
    PENDING,     // 검토 대기
    REVIEWING,   // 검토 중
    ACTION_TAKEN, // 조치 완료
    DISMISSED,   // 기각
    DUPLICATE    // 중복 신고
}
```

**킥 투표 엔티티:**
```kotlin
// domain/game/model/KickVoteEntity.kt
@Entity
@Table(name = "kick_votes")
data class KickVoteEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    val game: GameEntity,
    
    @Column(name = "target_user_id")
    val targetUserId: Long,
    
    @Column(name = "target_nickname")
    val targetNickname: String,
    
    @Column(name = "initiator_user_id")
    val initiatorUserId: Long,
    
    @Column(name = "initiator_nickname")
    val initiatorNickname: String,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "reason")
    val reason: KickReason,
    
    @Column(name = "votes_for")
    var votesFor: Int = 1, // 시작자가 첫 투표
    
    @Column(name = "votes_against")
    var votesAgainst: Int = 0,
    
    @Column(name = "required_votes")
    val requiredVotes: Int,
    
    @Column(name = "voter_ids", columnDefinition = "TEXT")
    var voterIds: String = "[]", // JSON array of voted user IDs
    
    @Column(name = "start_time")
    val startTime: Instant = Instant.now(),
    
    @Column(name = "end_time")
    var endTime: Instant? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    var status: KickVoteStatus = KickVoteStatus.ACTIVE,
    
    @Column(name = "time_limit_seconds")
    val timeLimitSeconds: Int = 60
)

enum class KickReason {
    GRIEFING, INAPPROPRIATE_BEHAVIOR, AFK, CHEATING, HARASSMENT
}

enum class KickVoteStatus {
    ACTIVE, PASSED, FAILED, CANCELLED, TIMEOUT
}
```

**행동 추적 시스템:**
```kotlin
// domain/moderation/service/BehaviorTrackingService.kt
@Service
@Transactional
class BehaviorTrackingService(
    private val behaviorLogRepository: BehaviorLogRepository,
    private val userPenaltyRepository: UserPenaltyRepository,
    private val gameRepository: GameRepository
) {
    
    fun recordBehavior(
        userId: Long,
        behaviorType: BehaviorType,
        gameNumber: Int? = null,
        severity: Int = 1,
        details: String? = null
    ) {
        val behaviorLog = BehaviorLogEntity(
            userId = userId,
            behaviorType = behaviorType,
            gameNumber = gameNumber,
            severity = severity,
            details = details
        )
        
        behaviorLogRepository.save(behaviorLog)
        
        // 부정적 행동인 경우 누적 점수 확인
        if (isNegativeBehavior(behaviorType)) {
            checkForPenalty(userId)
        }
    }
    
    fun recordGameLeave(userId: Long, gameNumber: Int, reason: String) {
        val game = gameRepository.findByGameNumber(gameNumber)
        val isInProgress = game?.gameState == GameState.IN_PROGRESS
        
        val severity = if (isInProgress) 3 else 1 // 진행 중 이탈은 더 높은 심각도
        
        recordBehavior(
            userId = userId,
            behaviorType = BehaviorType.GAME_LEAVE,
            gameNumber = gameNumber,
            severity = severity,
            details = "이탈 사유: $reason, 게임 상태: ${game?.gameState}"
        )
    }
    
    fun recordInappropriateChat(userId: Long, gameNumber: Int, message: String) {
        recordBehavior(
            userId = userId,
            behaviorType = BehaviorType.INAPPROPRIATE_CHAT,
            gameNumber = gameNumber,
            severity = 2,
            details = "부적절한 메시지: $message"
        )
    }
    
    fun recordPositiveBehavior(userId: Long, behaviorType: BehaviorType, details: String? = null) {
        recordBehavior(
            userId = userId,
            behaviorType = behaviorType,
            severity = -1, // 음수는 긍정적 행동
            details = details
        )
    }
    
    private fun checkForPenalty(userId: Long) {
        val recentNegativeBehaviors = behaviorLogRepository.findByUserIdAndTimestampAfterAndSeverityGreaterThan(
            userId,
            Instant.now().minus(Duration.ofDays(7)), // 최근 7일
            0
        )
        
        val totalSeverity = recentNegativeBehaviors.sumOf { it.severity }
        val behaviorCount = recentNegativeBehaviors.size
        
        when {
            totalSeverity >= 15 || behaviorCount >= 10 -> {
                // 임시 차단 (3일)
                issuePenalty(userId, PenaltyType.TEMPORARY_BAN, 3, "반복적인 부정 행동")
            }
            totalSeverity >= 10 || behaviorCount >= 7 -> {
                // 채팅 제한 (1일)
                issuePenalty(userId, PenaltyType.CHAT_RESTRICTION, 1, "부적절한 채팅 행동")
            }
            totalSeverity >= 5 || behaviorCount >= 5 -> {
                // 경고
                issuePenalty(userId, PenaltyType.WARNING, 0, "행동 개선 필요")
            }
        }
    }
    
    private fun issuePenalty(userId: Long, penaltyType: PenaltyType, durationDays: Int, reason: String) {
        // 이미 활성 페널티가 있는지 확인
        val activePenalty = userPenaltyRepository.findByUserIdAndStatusAndPenaltyType(
            userId, PenaltyStatus.ACTIVE, penaltyType
        )
        
        if (activePenalty != null) {
            // 기존 페널티 연장
            activePenalty.endTime = Instant.now().plus(Duration.ofDays(durationDays.toLong()))
            userPenaltyRepository.save(activePenalty)
        } else {
            // 새 페널티 생성
            val penalty = UserPenaltyEntity(
                userId = userId,
                penaltyType = penaltyType,
                startTime = Instant.now(),
                endTime = if (durationDays > 0) Instant.now().plus(Duration.ofDays(durationDays.toLong())) else Instant.now(),
                reason = reason
            )
            
            userPenaltyRepository.save(penalty)
        }
        
        // 사용자에게 페널티 알림 (WebSocket을 통해)
        notifyPenaltyIssued(userId, penaltyType, durationDays, reason)
    }
    
    fun getUserBehaviorSummary(userId: Long): UserBehaviorSummary {
        val recentBehaviors = behaviorLogRepository.findByUserIdAndTimestampAfter(
            userId,
            Instant.now().minus(Duration.ofDays(30))
        )
        
        val activePenalties = userPenaltyRepository.findByUserIdAndStatus(userId, PenaltyStatus.ACTIVE)
        
        val totalGames = recentBehaviors.filter { it.behaviorType == BehaviorType.GAME_LEAVE }.size
        val negativeScore = recentBehaviors.filter { it.severity > 0 }.sumOf { it.severity }
        val positiveScore = recentBehaviors.filter { it.severity < 0 }.sumOf { it.severity * -1 }
        
        return UserBehaviorSummary(
            userId = userId,
            recentGamesPlayed = totalGames,
            behaviorScore = positiveScore - negativeScore,
            activePenalties = activePenalties.map { PenaltyInfo.from(it) },
            riskLevel = calculateRiskLevel(negativeScore, totalGames)
        )
    }
    
    private fun calculateRiskLevel(negativeScore: Int, totalGames: Int): RiskLevel {
        val riskRatio = if (totalGames > 0) negativeScore.toDouble() / totalGames else 0.0
        
        return when {
            riskRatio >= 2.0 -> RiskLevel.HIGH
            riskRatio >= 1.0 -> RiskLevel.MEDIUM
            riskRatio >= 0.5 -> RiskLevel.LOW
            else -> RiskLevel.NONE
        }
    }
}

enum class RiskLevel {
    NONE, LOW, MEDIUM, HIGH
}
```

### 9. 통계 및 성과 시스템

**사용자 통계 엔티티:**
```kotlin
// domain/statistics/model/UserStatisticsEntity.kt
@Entity
@Table(name = "user_statistics")
data class UserStatisticsEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(name = "user_id", unique = true)
    val userId: Long,
    
    @Column(name = "games_played")
    var gamesPlayed: Int = 0,
    
    @Column(name = "games_won")
    var gamesWon: Int = 0,
    
    @Column(name = "games_as_liar")
    var gamesAsLiar: Int = 0,
    
    @Column(name = "liar_wins")
    var liarWins: Int = 0,
    
    @Column(name = "citizen_wins")
    var citizenWins: Int = 0,
    
    @Column(name = "total_playtime_minutes")
    var totalPlaytimeMinutes: Long = 0,
    
    @Column(name = "best_streak")
    var bestStreak: Int = 0,
    
    @Column(name = "current_streak")
    var currentStreak: Int = 0,
    
    @Column(name = "average_game_duration_minutes")
    var averageGameDurationMinutes: Double = 0.0,
    
    @Column(name = "successful_defenses")
    var successfulDefenses: Int = 0,
    
    @Column(name = "successful_accusations")
    var successfulAccusations: Int = 0,
    
    @Column(name = "total_votes_received")
    var totalVotesReceived: Int = 0,
    
    @Column(name = "last_game_at")
    var lastGameAt: Instant? = null,
    
    @Column(name = "updated_at")
    var updatedAt: Instant = Instant.now()
)
```

**게임 히스토리 엔티티:**
```kotlin
// domain/statistics/model/GameHistoryEntity.kt
@Entity
@Table(name = "game_history")
data class GameHistoryEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(name = "user_id")
    val userId: Long,
    
    @Column(name = "game_number")
    val gameNumber: Int,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    val role: PlayerRole,
    
    @Column(name = "won")
    val won: Boolean,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "winning_team")
    val winningTeam: WinningTeam,
    
    @Column(name = "was_eliminated")
    val wasEliminated: Boolean,
    
    @Column(name = "elimination_round")
    val eliminationRound: Int? = null,
    
    @Column(name = "votes_received")
    val votesReceived: Int = 0,
    
    @Column(name = "successful_defense")
    val successfulDefense: Boolean = false,
    
    @Column(name = "game_duration_minutes")
    val gameDurationMinutes: Int,
    
    @Column(name = "player_count")
    val playerCount: Int,
    
    @Column(name = "game_ended_at")
    val gameEndedAt: Instant,
    
    @Column(name = "created_at")
    val createdAt: Instant = Instant.now()
)
```

**통계 서비스:**
```kotlin
// domain/statistics/service/UserStatisticsService.kt
@Service
@Transactional
class UserStatisticsService(
    private val userStatisticsRepository: UserStatisticsRepository,
    private val gameHistoryRepository: GameHistoryRepository,
    private val achievementService: AchievementService
) {
    
    fun updateGameStatistics(gameNumber: Int, players: List<PlayerEntity>, game: GameEntity) {
        val gameDurationMinutes = Duration.between(game.createdAt.atZone(ZoneId.systemDefault()).toInstant(), 
                                                 game.endedAt ?: Instant.now()).toMinutes().toInt()
        
        players.forEach { player ->
            // 게임 히스토리 기록
            val gameHistory = GameHistoryEntity(
                userId = player.userId,
                gameNumber = gameNumber,
                role = player.role,
                won = didPlayerWin(player, game),
                winningTeam = game.winningTeam ?: WinningTeam.CITIZENS,
                wasEliminated = !player.isAlive,
                eliminationRound = if (!player.isAlive) game.gameCurrentRound else null,
                votesReceived = player.votesReceived,
                successfulDefense = player.state == PlayerState.DEFENDED && player.isAlive,
                gameDurationMinutes = gameDurationMinutes,
                playerCount = players.size,
                gameEndedAt = game.endedAt ?: Instant.now()
            )
            
            gameHistoryRepository.save(gameHistory)
            
            // 사용자 통계 업데이트
            updateUserStatistics(player.userId, gameHistory)
            
            // 업적 확인
            achievementService.checkAchievements(player.userId, gameHistory)
        }
    }
    
    private fun updateUserStatistics(userId: Long, gameHistory: GameHistoryEntity) {
        val stats = userStatisticsRepository.findByUserId(userId)
            ?: UserStatisticsEntity(userId = userId)
        
        // 기본 통계 업데이트
        stats.gamesPlayed++
        stats.totalPlaytimeMinutes += gameHistory.gameDurationMinutes
        stats.lastGameAt = gameHistory.gameEndedAt
        
        // 승리 통계
        if (gameHistory.won) {
            stats.gamesWon++
            stats.currentStreak++
            stats.bestStreak = maxOf(stats.bestStreak, stats.currentStreak)
            
            when (gameHistory.role) {
                PlayerRole.LIAR -> stats.liarWins++
                PlayerRole.CITIZEN -> stats.citizenWins++
            }
        } else {
            stats.currentStreak = 0
        }
        
        // 역할별 통계
        if (gameHistory.role == PlayerRole.LIAR) {
            stats.gamesAsLiar++
        }
        
        // 특별 통계
        if (gameHistory.successfulDefense) {
            stats.successfulDefenses++
        }
        
        stats.totalVotesReceived += gameHistory.votesReceived
        
        // 평균 게임 시간 계산
        stats.averageGameDurationMinutes = stats.totalPlaytimeMinutes.toDouble() / stats.gamesPlayed
        
        stats.updatedAt = Instant.now()
        userStatisticsRepository.save(stats)
    }
    
    fun getUserStatistics(userId: Long): UserStatisticsResponse {
        val stats = userStatisticsRepository.findByUserId(userId)
            ?: UserStatisticsEntity(userId = userId)
        
        val recentGames = gameHistoryRepository.findByUserIdOrderByGameEndedAtDesc(userId, PageRequest.of(0, 10))
        val achievements = achievementService.getUserAchievements(userId)
        
        return UserStatisticsResponse(
            userId = userId,
            gamesPlayed = stats.gamesPlayed,
            winRate = if (stats.gamesPlayed > 0) (stats.gamesWon.toDouble() / stats.gamesPlayed * 100) else 0.0,
            liarWinRate = if (stats.gamesAsLiar > 0) (stats.liarWins.toDouble() / stats.gamesAsLiar * 100) else 0.0,
            citizenWinRate = if ((stats.gamesPlayed - stats.gamesAsLiar) > 0) 
                (stats.citizenWins.toDouble() / (stats.gamesPlayed - stats.gamesAsLiar) * 100) else 0.0,
            averageGameDuration = stats.averageGameDurationMinutes,
            bestStreak = stats.bestStreak,
            currentStreak = stats.currentStreak,
            successfulDefenses = stats.successfulDefenses,
            totalPlaytime = stats.totalPlaytimeMinutes,
            recentGames = recentGames.content.map { GameHistoryResponse.from(it) },
            achievements = achievements,
            lastGameAt = stats.lastGameAt
        )
    }
    
    fun getLeaderboard(category: LeaderboardCategory, limit: Int = 10): List<LeaderboardEntry> {
        return when (category) {
            LeaderboardCategory.WIN_RATE -> {
                userStatisticsRepository.findTopByWinRate(limit).map { stats ->
                    LeaderboardEntry(
                        userId = stats.userId,
                        nickname = getUserNickname(stats.userId),
                        value = if (stats.gamesPlayed >= 5) (stats.gamesWon.toDouble() / stats.gamesPlayed * 100) else 0.0,
                        gamesPlayed = stats.gamesPlayed
                    )
                }
            }
            LeaderboardCategory.GAMES_PLAYED -> {
                userStatisticsRepository.findTopByGamesPlayed(limit).map { stats ->
                    LeaderboardEntry(
                        userId = stats.userId,
                        nickname = getUserNickname(stats.userId),
                        value = stats.gamesPlayed.toDouble(),
                        gamesPlayed = stats.gamesPlayed
                    )
                }
            }
            LeaderboardCategory.CURRENT_STREAK -> {
                userStatisticsRepository.findTopByCurrentStreak(limit).map { stats ->
                    LeaderboardEntry(
                        userId = stats.userId,
                        nickname = getUserNickname(stats.userId),
                        value = stats.currentStreak.toDouble(),
                        gamesPlayed = stats.gamesPlayed
                    )
                }
            }
        }
    }
    
    private fun didPlayerWin(player: PlayerEntity, game: GameEntity): Boolean {
        return when (game.winningTeam) {
            WinningTeam.CITIZENS -> player.role == PlayerRole.CITIZEN
            WinningTeam.LIARS -> player.role == PlayerRole.LIAR
            null -> false
        }
    }
}

enum class LeaderboardCategory {
    WIN_RATE, GAMES_PLAYED, CURRENT_STREAK
}
```

---

## 📚 데이터베이스 마이그레이션

### Phase 1: Critical Priority 테이블 생성

```sql
-- 플레이어 준비 상태 테이블
CREATE TABLE player_readiness (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    is_ready BOOLEAN DEFAULT FALSE,
    ready_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id)
);

-- 연결 로그 테이블
CREATE TABLE connection_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    game_id BIGINT REFERENCES games(id),
    action VARCHAR(30) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    grace_period_seconds INTEGER DEFAULT 30
);

-- 타이브레이커 테이블
CREATE TABLE tie_breaker (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    tied_player_ids TEXT NOT NULL,
    method VARCHAR(20) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    winner_id BIGINT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    time_limit_seconds INTEGER DEFAULT 30
);

-- games 테이블에 필요한 컬럼 추가
ALTER TABLE games ADD COLUMN IF NOT EXISTS countdown_started_at TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS countdown_end_time TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS countdown_duration_seconds INTEGER DEFAULT 10;
ALTER TABLE games ADD COLUMN IF NOT EXISTS min_players INTEGER DEFAULT 3;
ALTER TABLE games ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 15;
ALTER TABLE games ADD COLUMN IF NOT EXISTS required_votes INTEGER;
ALTER TABLE games ADD COLUMN IF NOT EXISTS current_votes INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS active_players_count INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS voting_phase VARCHAR(20);

-- players 테이블에 추가 필드
ALTER TABLE players ADD COLUMN IF NOT EXISTS voted_at TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS eliminated_at TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS elimination_reason VARCHAR(100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS connection_status VARCHAR(20) DEFAULT 'CONNECTED';
```

### Phase 2: High Priority 테이블

```sql
-- 커뮤니티 제출 테이블
CREATE TABLE community_submissions (
    id BIGSERIAL PRIMARY KEY,
    submitter_id BIGINT NOT NULL,
    submitter_nickname VARCHAR(50) NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    content VARCHAR(500) NOT NULL,
    subject_id BIGINT REFERENCES subjects(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by BIGINT,
    review_comment VARCHAR(1000),
    approval_votes INTEGER DEFAULT 0,
    rejection_votes INTEGER DEFAULT 0
);

-- 킥 투표 테이블
CREATE TABLE kick_votes (
    id BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    target_user_id BIGINT NOT NULL,
    target_nickname VARCHAR(50) NOT NULL,
    initiator_user_id BIGINT NOT NULL,
    initiator_nickname VARCHAR(50) NOT NULL,
    reason VARCHAR(30) NOT NULL,
    votes_for INTEGER DEFAULT 1,
    votes_against INTEGER DEFAULT 0,
    required_votes INTEGER NOT NULL,
    voter_ids TEXT DEFAULT '[]',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    time_limit_seconds INTEGER DEFAULT 60
);
```

### Phase 3: Medium Priority 테이블

```sql
-- 플레이어 신고 테이블
CREATE TABLE player_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_user_id BIGINT NOT NULL,
    reported_user_id BIGINT NOT NULL,
    game_number INTEGER NOT NULL,
    reason VARCHAR(30) NOT NULL,
    description VARCHAR(500),
    evidence VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    reviewed_at TIMESTAMP,
    reviewed_by BIGINT,
    action_taken VARCHAR(500)
);

-- 행동 로그 테이블
CREATE TABLE behavior_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    behavior_type VARCHAR(30) NOT NULL,
    game_number INTEGER,
    severity INTEGER NOT NULL,
    details VARCHAR(1000),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 페널티 테이블
CREATE TABLE user_penalties (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    penalty_type VARCHAR(20) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- 사용자 통계 테이블
CREATE TABLE user_statistics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_as_liar INTEGER DEFAULT 0,
    liar_wins INTEGER DEFAULT 0,
    citizen_wins INTEGER DEFAULT 0,
    total_playtime_minutes BIGINT DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    average_game_duration_minutes DOUBLE PRECISION DEFAULT 0.0,
    successful_defenses INTEGER DEFAULT 0,
    successful_accusations INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    last_game_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게임 히스토리 테이블
CREATE TABLE game_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    game_number INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL,
    won BOOLEAN NOT NULL,
    winning_team VARCHAR(20) NOT NULL,
    was_eliminated BOOLEAN NOT NULL,
    elimination_round INTEGER,
    votes_received INTEGER DEFAULT 0,
    successful_defense BOOLEAN DEFAULT FALSE,
    game_duration_minutes INTEGER NOT NULL,
    player_count INTEGER NOT NULL,
    game_ended_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_connection_logs_user_game ON connection_logs(user_id, game_id);
CREATE INDEX idx_connection_logs_timestamp ON connection_logs(timestamp);
CREATE INDEX idx_behavior_logs_user_timestamp ON behavior_logs(user_id, timestamp);
CREATE INDEX idx_game_history_user_ended ON game_history(user_id, game_ended_at);
CREATE INDEX idx_player_reports_status ON player_reports(status);
CREATE INDEX idx_community_submissions_status ON community_submissions(status);
```

---

## 🔌 API 엔드포인트 추가

### GameController 확장

```kotlin
@RestController
@RequestMapping("/api/games")
class EnhancedGameController(
    private val gameService: GameService,
    private val playerReadinessService: PlayerReadinessService,
    private val gameCountdownService: GameCountdownService,
    private val enhancedVotingService: EnhancedVotingService,
    private val tieBreakerService: TieBreakerService,
    private val enhancedConnectionService: EnhancedConnectionService
) {
    
    // 기존 엔드포인트들...
    
    // === 플레이어 준비 상태 ===
    @PostMapping("/{gameNumber}/ready")
    fun togglePlayerReady(
        @PathVariable gameNumber: Int, 
        session: HttpSession
    ): ResponseEntity<PlayerReadyResponse> {
        return ResponseEntity.ok(playerReadinessService.togglePlayerReady(gameNumber, session))
    }
    
    @GetMapping("/{gameNumber}/ready-status")
    fun getAllReadyStates(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<List<PlayerReadyResponse>> {
        return ResponseEntity.ok(playerReadinessService.getAllReadyStates(gameNumber))
    }
    
    // === 카운트다운 ===
    @PostMapping("/{gameNumber}/countdown/start")
    fun startCountdown(
        @PathVariable gameNumber: Int, 
        session: HttpSession
    ): ResponseEntity<CountdownResponse> {
        return ResponseEntity.ok(gameCountdownService.startCountdown(gameNumber, session))
    }
    
    @PostMapping("/{gameNumber}/countdown/cancel")
    fun cancelCountdown(
        @PathVariable gameNumber: Int, 
        session: HttpSession
    ): ResponseEntity<CountdownResponse> {
        return ResponseEntity.ok(gameCountdownService.cancelCountdown(gameNumber))
    }
    
    @GetMapping("/{gameNumber}/countdown/status")
    fun getCountdownStatus(
        @PathVariable gameNumber: Int
    ): ResponseEntity<CountdownResponse?> {
        return ResponseEntity.ok(gameCountdownService.getCountdownStatus(gameNumber))
    }
    
    // === 향상된 투표 ===
    @PostMapping("/{gameNumber}/vote")
    fun submitVote(
        @PathVariable gameNumber: Int,
        @RequestBody request: VoteRequest,
        session: HttpSession
    ): ResponseEntity<VoteResponse> {
        return ResponseEntity.ok(enhancedVotingService.submitVote(gameNumber, request.targetPlayerId, session))
    }
    
    @GetMapping("/{gameNumber}/voting-status")
    fun getVotingStatus(
        @PathVariable gameNumber: Int
    ): ResponseEntity<VotingStatusResponse> {
        return ResponseEntity.ok(enhancedVotingService.getVotingStatus(gameNumber))
    }
    
    // === 타이브레이커 ===
    @PostMapping("/tie-breaker/{tieBreakererId}/decide")
    fun submitOwnerDecision(
        @PathVariable tieBreakererId: Long,
        @RequestBody request: OwnerDecisionRequest,
        session: HttpSession
    ): ResponseEntity<TieBreakerResponse> {
        return ResponseEntity.ok(tieBreakerService.submitOwnerDecision(tieBreakererId, request.winnerId, session))
    }
    
    // === 연결 상태 ===
    @GetMapping("/{gameNumber}/connection-status")
    fun getConnectionStatus(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<List<PlayerConnectionStatus>> {
        return ResponseEntity.ok(enhancedConnectionService.getConnectionStatus(gameNumber))
    }
    
    // === 세션 코드 ===
    @PostMapping("/{gameNumber}/generate-share-code")
    fun generateShareCode(
        @PathVariable gameNumber: Int,
        session: HttpSession
    ): ResponseEntity<ShareCodeResponse> {
        val userId = sessionService.getCurrentUserId(session)
        val shareCode = secureSessionService.generateShareableCode(gameNumber, userId)
        
        return if (shareCode != null) {
            ResponseEntity.ok(ShareCodeResponse(shareCode, true))
        } else {
            ResponseEntity.badRequest().body(ShareCodeResponse(null, false, "공유 코드 생성 실패"))
        }
    }
    
    @PostMapping("/join-by-share-code")
    fun joinByShareCode(
        @RequestBody request: ShareCodeJoinRequest,
        session: HttpSession
    ): ResponseEntity<GameStateResponse> {
        val validationResult = secureSessionService.validateShareableCode(request.shareCode)
        
        return when (validationResult) {
            is ShareCodeValidationResult.VALID -> {
                val joinRequest = JoinGameRequest(validationResult.gameNumber)
                ResponseEntity.ok(gameService.joinGame(joinRequest, session))
            }
            else -> {
                throw IllegalArgumentException("유효하지 않거나 만료된 공유 코드입니다.")
            }
        }
    }
}
```

### 새로운 콘텐츠 컨트롤러

```kotlin
@RestController
@RequestMapping("/api/content")
class CommunityContentController(
    private val communityContentService: CommunityContentService
) {
    
    @PostMapping("/submit")
    fun submitContent(
        @RequestBody request: ContentSubmissionRequest,
        session: HttpSession
    ): ResponseEntity<SubmissionResponse> {
        return ResponseEntity.ok(communityContentService.submitContent(request, session))
    }
    
    @PostMapping("/batch-submit")
    fun batchSubmitContent(
        @RequestBody request: BatchContentRequest,
        session: HttpSession
    ): ResponseEntity<BatchSubmissionResponse> {
        return ResponseEntity.ok(communityContentService.batchSubmitContent(request, session))
    }
    
    @GetMapping("/pending")
    fun getPendingSubmissions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        session: HttpSession
    ): ResponseEntity<Page<CommunitySubmissionEntity>> {
        // 관리자 권한 확인
        return ResponseEntity.ok(communityContentService.getPendingSubmissions(page, size))
    }
    
    @PostMapping("/{submissionId}/approve")
    fun approveSubmission(
        @PathVariable submissionId: Long,
        session: HttpSession
    ): ResponseEntity<ApprovalResponse> {
        return ResponseEntity.ok(communityContentService.approveSubmission(submissionId, session))
    }
    
    @PostMapping("/{submissionId}/reject")
    fun rejectSubmission(
        @PathVariable submissionId: Long,
        @RequestBody request: RejectRequest,
        session: HttpSession
    ): ResponseEntity<ApprovalResponse> {
        return ResponseEntity.ok(communityContentService.rejectSubmission(submissionId, request.reason, session))
    }
}
```

---

## 🚀 구현 우선순위 및 예상 작업 기간

### Phase 1: Critical Infrastructure (2주)
1. **플레이어 준비 상태 시스템** (3-4일)
   - 엔티티, Repository, Service, API 구현
   - WebSocket 이벤트 통합

2. **게임 시작 카운트다운** (2-3일)
   - 스케줄링 시스템 구현
   - 취소 로직 및 WebSocket 알림

3. **향상된 연결 관리** (4-5일)
   - 유예 시간 시스템
   - 최소 인원 관리
   - 재연결 로직

4. **동적 투표 조정** (3-4일)
   - 투표 수 계산 로직
   - 실시간 투표 현황

### Phase 2: Game Quality (1.5주)
1. **타이브레이커 시스템** (4-5일)
   - 다양한 타이브레이커 방법
   - 시간 제한 및 자동 처리

2. **세션 코드 보안** (2-3일)
   - 암호화 시스템
   - 공유 코드 기능

3. **커뮤니티 콘텐츠** (3-4일)
   - 제출 및 승인 시스템
   - 배치 처리

### Phase 3: Community Features (1주)
1. **신고 및 킥 시스템** (3-4일)
2. **행동 추적** (2-3일)
3. **통계 시스템** (2-3일)

---

## 📊 성능 및 확장성 고려사항

### 현재 아키텍처 강점
- ✅ Redis를 통한 분산 세션 관리
- ✅ WebSocket 연결 풀링
- ✅ HikariCP 데이터베이스 연결 풀
- ✅ JPA 쿼리 최적화

### 추가 권장사항

1. **캐싱 전략**
```kotlin
// 자주 조회되는 데이터 캐싱
@Cacheable(value = "gameStates", key = "#gameNumber")
fun getCachedGameState(gameNumber: Int): GameStateResponse

@Cacheable(value = "userStats", key = "#userId")
fun getCachedUserStatistics(userId: Long): UserStatisticsResponse
```

2. **데이터베이스 최적화**
```sql
-- 복합 인덱스 추가
CREATE INDEX idx_players_game_alive ON players(game_id, is_alive);
CREATE INDEX idx_games_state_number ON games(game_state, game_number);
CREATE INDEX idx_connection_logs_user_recent ON connection_logs(user_id, timestamp DESC);
```

3. **백그라운드 작업 최적화**
```kotlin
@Async
@Scheduled(fixedDelay = 300000) // 5분마다
fun cleanupExpiredConnections() {
    // 만료된 연결 및 유예 시간 정리
}

@Async  
@Scheduled(fixedDelay = 3600000) // 1시간마다
fun updateStatistics() {
    // 통계 데이터 배치 업데이트
}
```

---

## 🧪 테스트 전략

### 단위 테스트
```kotlin
@ExtendWith(MockitoExtension::class)
class PlayerReadinessServiceTest {
    
    @Test
    fun `모든 플레이어가 준비되면 true를 반환한다`() {
        // Given
        val game = createTestGame()
        val readyStates = listOf(
            createReadyState(1L, true),
            createReadyState(2L, true)
        )
        
        // When & Then
        assertTrue(playerReadinessService.areAllPlayersReady(game))
    }
}
```

### 통합 테스트
```kotlin
@SpringBootTest
@Testcontainers
class GameIntegrationTest {
    
    @Test
    fun `플레이어 준비 상태 변경 시 다른 플레이어들에게 알림이 전송된다`() {
        // Given
        val gameNumber = createTestGame()
        val players = createTestPlayers(gameNumber, 3)
        
        // When
        playerReadinessService.togglePlayerReady(gameNumber, players[0].session)
        
        // Then
        verify(gameMonitoringService).notifyPlayerReadyStateChanged(any(), any(), any())
    }
}
```

### 성능 테스트
```kotlin
@Test
fun `동시에 100명이 게임에 참여할 수 있다`() {
    val futures = (1..100).map { userId ->
        CompletableFuture.supplyAsync {
            gameService.joinGame(JoinGameRequest(gameNumber), createSession(userId))
        }
    }
    
    val results = CompletableFuture.allOf(*futures.toTypedArray()).get()
    assertThat(results).hasSize(100)
}
```

---

## ✅ 완료 기준

### Critical Priority 완료 조건
- [ ] 모든 플레이어 준비 상태 시스템 작동
- [ ] 카운트다운 시작/취소 기능 구현
- [ ] 연결 해제 시 유예 시간 적용
- [ ] 최소 인원 미달 시 게임 종료
- [ ] 동적 투표 수 계산 및 적용
- [ ] 실시간 투표 현황 표시

### High Priority 완료 조건  
- [ ] 타이브레이커 시스템 작동
- [ ] 세션 코드 암호화 및 공유 기능
- [ ] 커뮤니티 콘텐츠 제출/승인 시스템
- [ ] 배치 콘텐츠 추가 기능

### Medium Priority 완료 조건
- [ ] 신고 시스템 및 킥 투표 기능
- [ ] 행동 추적 및 자동 페널티 시스템
- [ ] 사용자 통계 및 리더보드
- [ ] 게임 히스토리 추적

### 전체 시스템 완료 조건
- [ ] 모든 새로운 API 엔드포인트 작동
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] 통합 테스트 시나리오 통과
- [ ] 성능 테스트 (동시 접속 100명) 통과
- [ ] WebSocket 이벤트 정상 전송
- [ ] 프론트엔드 요구사항 모두 지원 가능

이 종합적인 백엔드 개선 프롬프트를 통해 Claude Sonnet 4는 체계적으로 모든 요구사항을 구현하여 프론트엔드와 완벽하게 연동되는 백엔드 시스템을 구축할 수 있습니다.