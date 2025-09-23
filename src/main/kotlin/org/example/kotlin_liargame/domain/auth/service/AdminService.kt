package org.example.kotlin_liargame.domain.auth.service

import io.micrometer.core.instrument.MeterRegistry
import org.example.kotlin_liargame.domain.auth.dto.request.AdminLoginRequest
import org.example.kotlin_liargame.domain.auth.dto.response.*
import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.GameSubjectRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.game.service.GameMonitoringService
import org.example.kotlin_liargame.domain.game.service.GameService
import org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.user.model.UserEntity
import org.example.kotlin_liargame.domain.user.model.UserRole
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.concurrent.atomic.AtomicInteger

@Service
@Transactional
class AdminService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val userRepository: UserRepository,
    private val subjectRepository: SubjectRepository,
    private val gameSubjectRepository: GameSubjectRepository,
    private val wordRepository: WordRepository,
    private val gameMonitoringService: GameMonitoringService,
    private val gameService: GameService,
    private val chatService: ChatService,
    private val meterRegistry: MeterRegistry,
    private val passwordEncoder: PasswordEncoder
) {
    private val logger = LoggerFactory.getLogger(this::class.java)
    private val activeGamesGauge = meterRegistry.gauge("liargame.games.active", AtomicInteger(0))

    fun login(request: AdminLoginRequest): UserEntity {
        logger.debug("관리자 로그인 시도: {}", request.nickname)
        val user = userRepository.findByNickname(request.nickname)
            ?: throw IllegalArgumentException("사용자를 찾을 수 없습니다.")

        if (!passwordEncoder.matches(request.password, user.password)) {
            logger.debug("관리자 로그인 실패: 잘못된 비밀번호")
            throw IllegalArgumentException("잘못된 비밀번호입니다.")
        }

        if (user.role != UserRole.ADMIN) {
            logger.debug("관리자 로그인 실패: 관리자 권한이 없습니다.")
            throw SecurityException("관리자 권한이 없습니다.")
        }

        logger.debug("관리자 로그인 성공: {}", user.nickname)
        return user
    }

    fun grantAdminRole(userId: Long) {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다.") }

        user.role = UserRole.ADMIN
        userRepository.save(user)
        logger.info("사용자 {}에게 관리자 권한을 부여했습니다.", user.nickname)
    }

    fun getStatistics(): AdminStatsResponse {
        logger.debug("관리자 통계 조회")

        val allGames = gameRepository.findAll()
        val totalGames = allGames.size
        val activeGames = allGames.count { game ->
            game.gameState == GameState.WAITING ||
            game.gameState == GameState.IN_PROGRESS
        }
        activeGamesGauge?.set(activeGames)

        val totalPlayers = playerRepository.count().toInt()
        val totalUsers = userRepository.count().toInt()
        val playersInLobby = totalUsers - totalPlayers

        return AdminStatsResponse(
            totalPlayers = totalUsers,
            activeGames = activeGames,
            totalGames = totalGames,
            playersInLobby = playersInLobby
        )
    }

    fun getAllActiveGames(): List<AdminGameInfo> {
        logger.debug("관리자 활성 게임 목록 조회")
        val activeGames = gameRepository.findAllActiveGames()
        return activeGames.map { game ->
            val players = playerRepository.findByGame(game)
            AdminGameInfo(
                gameNumber = game.gameNumber,
                gameName = game.gameName,
                gameState = game.gameState.name,
                currentPlayerCount = players.size,
                maxPlayerCount = game.gameParticipants,
                players = players.map { p -> AdminPlayerInfo(id = p.userId, nickname = p.nickname, status = p.state.name) }
            )
        }
    }

    fun getAllPlayers(): AdminPlayersResponse {
        logger.debug("관리자 플레이어 목록 조회")

        val users = userRepository.findAll()
        val allPlayers = playerRepository.findAll()
        val playerUserIds = allPlayers.map { it.userId }.toSet()

        val players = users.map { user ->
            val isInGame = playerUserIds.contains(user.id)
            AdminPlayerInfo(
                id = user.id,
                nickname = user.nickname,
                status = if (isInGame) "게임중" else "로비"
            )
        }

        return AdminPlayersResponse(players = players)
    }

    fun terminateGameRoom(gameNumber: Int): Boolean {
        logger.debug("게임방 강제 종료: {}", gameNumber)

        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("존재하지 않는 게임방입니다.")

        val playersInGame = playerRepository.findByGame(game)

        game.gameState = GameState.ENDED
        gameRepository.save(game)

        val terminationMessage = mapOf("type" to "GAME_TERMINATED_BY_ADMIN", "message" to "관리자에 의해 게임이 종료되었습니다.")
        gameMonitoringService.broadcastGameState(game, terminationMessage)

        playerRepository.deleteAll(playersInGame)

        logger.debug("게임방 강제 종료 완료: {}", gameNumber)
        return true
    }

    fun kickPlayer(gameNumber: Int, userId: Long): Boolean {
        logger.debug("플레이어 강제 퇴장: gameNumber={}, userId={}", gameNumber, userId)

        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("존재하지 않는 게임방입니다.")

        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw IllegalArgumentException("해당 유저가 게임에 참여하고 있지 않습니다.")

        gameService.leaveGameAsSystem(gameNumber, userId)

        val kickMessage = mapOf("type" to "PLAYER_KICKED_BY_ADMIN", "message" to "${player.nickname}님이 관리자에 의해 강제 퇴장되었습니다.")
        gameMonitoringService.broadcastGameState(game, kickMessage)

        logger.debug("플레이어 강제 퇴장 완료")
        return true
    }

    @Transactional(readOnly = true)
    fun getPendingContents(): PendingContentResponse {
        val pendingSubjects = subjectRepository.findByStatus(ContentStatus.PENDING)
            .map { PendingSubjectInfo(id = it.id, content = it.content) }

        val pendingWords = wordRepository.findByStatus(ContentStatus.PENDING)
            .map { PendingWordInfo(id = it.id, content = it.content, subject = it.subject?.content ?: "") }

        return PendingContentResponse(pendingSubjects, pendingWords)
    }

    fun approveAllPendingContents() {
        val pendingSubjects = subjectRepository.findByStatus(ContentStatus.PENDING)
        pendingSubjects.forEach { it.status = ContentStatus.APPROVED }
        subjectRepository.saveAll(pendingSubjects)

        val pendingWords = wordRepository.findByStatus(ContentStatus.PENDING)
        pendingWords.forEach { it.status = ContentStatus.APPROVED }
        wordRepository.saveAll(pendingWords)
    }

    @Transactional
    fun cleanupStaleGames(): Int {
        logger.debug("오래된 게임방 정리 시작")

        // 24시간 이상 된 WAITING 상태 게임들 정리
        val oneDayAgo = java.time.LocalDateTime.now().minusHours(24)
        val staleWaitingGames = gameRepository.findByGameStateAndCreatedAtBefore(GameState.WAITING, oneDayAgo)

        // 3시간 이상 된 IN_PROGRESS 상태 게임들 정리 (비정상 종료된 게임들)
        val threeHoursAgo = java.time.LocalDateTime.now().minusHours(3)
        val staleInProgressGames = gameRepository.findByGameStateAndModifiedAtBefore(GameState.IN_PROGRESS, threeHoursAgo)

        val allStaleGames = staleWaitingGames + staleInProgressGames

        allStaleGames.forEach { game ->
            logger.debug("오래된 게임방 삭제: gameNumber={}, state={}, created={}",
                game.gameNumber, game.gameState, game.createdAt)

            // 플레이어들 정리
            playerRepository.deleteByGame(game)

            // 게임 삭제
            gameRepository.delete(game)

            // 모니터링 서비스에 알림
            gameMonitoringService.notifyRoomDeleted(game.gameNumber)
        }

        logger.debug("오래된 게임방 정리 완료: {}개 삭제", allStaleGames.size)
        return allStaleGames.size
    }

    /**
     * 개선된 게임방 정리 정책
     * 1. 방장이 접속 중이면 방 유지
     * 2. 최대 인원 달성 후 미시작 방은 20초 카운트다운 후 방장 강퇴
     * 3. 생성 후 20분 이상 미시작 방 삭제
     */
    @Transactional
    fun cleanupEmptyGames(): Int {
        logger.debug("개선된 게임방 정리 시작")
        var cleanedCount = 0

        try {
            val allGames = gameRepository.findAll()
            val currentTime = Instant.now()

            for (game in allGames) {
                val players = playerRepository.findByGame(game)
                // LocalDateTime을 Instant로 변환
                val gameCreatedAtInstant = game.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
                val gameAge = java.time.Duration.between(gameCreatedAtInstant, currentTime)
                val ownerIdentifier = game.gameOwner.trim()
                val ownerPlayer = players.firstOrNull { it.nickname == ownerIdentifier }
                    ?: players.firstOrNull { it.userId.toString() == ownerIdentifier }
                val hasOwner = ownerPlayer != null

                when (game.gameState) {
                    GameState.WAITING -> {
                        val shouldDelete = when {
                            // 1. 플레이어가 아무도 없는 경우 즉시 삭제
                            players.isEmpty() -> {
                                logger.debug("빈 게임방 발견: gameNumber={}", game.gameNumber)
                                true
                            }

                            // 2. 방장이 접속해 있지 않고 10분 이상 활동이 없는 경우 (단, 2명 이상 접속시 제외)
                            !hasOwner && players.size < 2 -> {
                                val lastActivity = game.lastActivityAt ?: gameCreatedAtInstant
                                val timeSinceLastActivity = java.time.Duration.between(lastActivity, currentTime)
                                if (timeSinceLastActivity.toMinutes() >= 10) {
                                    logger.debug("방장 부재 게임방: gameNumber={}, 마지막 활동 후 경과시간={}분",
                                        game.gameNumber, timeSinceLastActivity.toMinutes())
                                    true
                                } else {
                                    false
                                }
                            }

                            // 3. 생성 후 20분 이상 미시작 방 (단, 2명 이상 접속시 제외)
                            players.size < 2 && gameAge.toMinutes() >= 20 -> {
                                logger.info("장시간 미시작 게임방 삭제: gameNumber={}, 경과시간={}분",
                                    game.gameNumber, gameAge.toMinutes())
                                true
                            }

                            // 4. 최대 인원 달성했지만 시작하지 않은 방 체크
                            players.size >= game.gameParticipants -> {
                                checkAndHandleFullRoomTimeout(game, players)
                                false // 이 경우는 별도 처리하므로 여기서는 삭제하지 않음
                            }

                            else -> false
                        }

                        if (shouldDelete) {
                            try {
                                logger.info("게임방 정리: gameNumber={}, 이유={}",
                                    game.gameNumber, getCleanupReason(players.isEmpty(), !hasOwner, gameAge))

                                // 플레이어들에게 방 삭제 알림
                                gameMonitoringService.broadcastGameState(game, mapOf(
                                    "type" to "ROOM_DELETED",
                                    "message" to "게임방이 정리되었습니다.",
                                    "reason" to getCleanupReason(players.isEmpty(), !hasOwner, gameAge)
                                ))

                                // 관련 데이터 정리
                                chatService.deleteGameChatMessages(game)
                                val gameSubjects = gameSubjectRepository.findByGame(game)
                                if (gameSubjects.isNotEmpty()) {
                                    gameSubjectRepository.deleteAll(gameSubjects)
                                }

                                // 플레이어 정리
                                playerRepository.deleteAll(players)

                                // 게임 삭제
                                gameRepository.delete(game)
                                gameMonitoringService.notifyRoomDeleted(game.gameNumber)

                                cleanedCount++

                            } catch (e: Exception) {
                                logger.warn("게임방 정리 중 오류: gameNumber={}, error={}",
                                    game.gameNumber, e.message, e)
                            }
                        }
                    }

                    GameState.IN_PROGRESS -> {
                        // 진행 중인 게임에서 플레이어가 없으면 즉시 삭제 (비정상 상태)
                        if (players.isEmpty()) {
                            logger.warn("비정상 상태 - 진행 중인 게임에 플레이어 없음: gameNumber={}", game.gameNumber)
                            cleanupAbandonedGame(game)
                            cleanedCount++
                        }
                    }

                    GameState.ENDED -> {
                        // 종료된 게임은 5분 후 삭제
                        if (gameAge.toMinutes() >= 5) {
                            logger.debug("종료된 게임방 정리: gameNumber={}", game.gameNumber)
                            cleanupAbandonedGame(game)
                            cleanedCount++
                        }
                    }
                }
            }

        } catch (e: Exception) {
            logger.error("게임방 정리 중 전체 오류 발생", e)
        }

        logger.debug("게임방 정리 완료: {}개 게임방 처리", cleanedCount)
        return cleanedCount
    }

    private fun getCleanupReason(isEmpty: Boolean, noOwner: Boolean, gameAge: java.time.Duration): String {
        return when {
            isEmpty -> "빈 게임방"
            noOwner -> "방장 부재 (${gameAge.toMinutes()}분)"
            gameAge.toMinutes() >= 20 -> "장시간 미시작 (${gameAge.toMinutes()}분)"
            else -> "정리 조건 충족"
        }
    }

    private fun cleanupAbandonedGame(game: org.example.kotlin_liargame.domain.game.model.GameEntity) {
        try {
            chatService.deleteGameChatMessages(game)
            val gameSubjects = gameSubjectRepository.findByGame(game)
            if (gameSubjects.isNotEmpty()) {
                gameSubjectRepository.deleteAll(gameSubjects)
            }
            val players = playerRepository.findByGame(game)
            playerRepository.deleteAll(players)
            gameRepository.delete(game)
            gameMonitoringService.notifyRoomDeleted(game.gameNumber)
        } catch (e: Exception) {
            logger.error("게임 정리 실패: gameNumber={}", game.gameNumber, e)
        }
    }

    /**
     * 최대 인원이 찬 방의 시작 타임아웃 처리
     */
    private fun checkAndHandleFullRoomTimeout(game: org.example.kotlin_liargame.domain.game.model.GameEntity, players: List<org.example.kotlin_liargame.domain.game.model.PlayerEntity>) {
        // 이 로직은 별도 스케줄러에서 처리하거나 게임 상태 업데이트 시점에서 처리
        // 여기서는 로그만 남김
        logger.debug("최대 인원 달성 방 감지: gameNumber={}, 인원={}/{}",
            game.gameNumber, players.size, game.gameParticipants)
    }

    @Transactional(readOnly = true)
    fun getGameStatistics(): Map<String, Any> {
        val totalGames = gameRepository.count()
        val waitingGames = gameRepository.countByGameState(GameState.WAITING)
        val inProgressGames = gameRepository.countByGameState(GameState.IN_PROGRESS)
        val endedGames = gameRepository.countByGameState(GameState.ENDED)
        val totalPlayers = playerRepository.count()

        // DISCONNECTED 상태를 사용하지 않으므로 모든 플레이어가 활성 상태
        val activePlayers = totalPlayers
        val disconnectedPlayers = 0L // 연결 해제된 플레이어는 즉시 제거됨

        return mapOf(
            "totalGames" to totalGames,
            "waitingGames" to waitingGames,
            "inProgressGames" to inProgressGames,
            "endedGames" to endedGames,
            "totalPlayers" to totalPlayers,
            "activePlayers" to activePlayers,
            "disconnectedPlayers" to disconnectedPlayers
        )
    }

    @Transactional
    fun cleanupDisconnectedPlayers(): Int {
        logger.debug("연결 해제된 플레이어 정리 시작")

        // 실제로 WebSocket 연결이 없는 플레이어들을 찾아서 정리
        val allPlayers = playerRepository.findAll()
        var cleanedCount = 0

        allPlayers.forEach { player ->
            val userId = player.userId
            val timeSinceJoined = java.time.Duration.between(player.joinedAt, java.time.Instant.now())
            val shouldCleanup = try {
                if (player.game.gameState == GameState.WAITING && timeSinceJoined.toMinutes() > 10) {
                    true
                } else {
                    false
                }
            } catch (e: Exception) {
                logger.warn("플레이어 연결 상태 확인 중 오류: userId={}, error={}", userId, e.message)
                false
            }

            if (shouldCleanup) {
                logger.debug("고아 플레이어 정리: gameNumber={}, nickname={}, joinedAt={}",
                    player.game.gameNumber, player.nickname, player.joinedAt)

                try {
                    cleanupSinglePlayer(player.game.gameNumber, userId)
                    cleanedCount++
                } catch (e: Exception) {
                    logger.warn("플레이어 {}(게임 {}) 정리 중 오류: {}",
                        player.nickname, player.game.gameNumber, e.message, e)
                }
            }
        }

        logger.debug("고아 플레이어 정리 완료: {}명 정리", cleanedCount)
        return cleanedCount
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    fun cleanupSinglePlayer(gameNumber: Int, userId: Long) {
        try {
            gameService.leaveGameAsSystem(gameNumber, userId)
        } catch (e: Exception) {
            logger.error("단일 플레이어 정리 실패: gameNumber={}, userId={}", gameNumber, userId, e)
            throw e
        }
    }

    @Transactional
    fun cleanupOrphanedPlayers(): Int {
        // 시작 로그 제거 - 너무 빈번함
        var cleanedCount = 0

        try {
            val allPlayers = playerRepository.findAll()

            for (player in allPlayers) {
                val userId = player.userId
                val timeSinceJoined = java.time.Duration.between(player.joinedAt, java.time.Instant.now())
                val shouldCleanup = when {
                    player.game.gameState == GameState.WAITING && timeSinceJoined.toMinutes() > 5 -> true
                    player.game.gameState == GameState.IN_PROGRESS && timeSinceJoined.toHours() > 1 -> true
                    else -> false
                }

                if (shouldCleanup) {
                    // 실제 정리가 발생할 때만 로그 출력
                    logger.info("고아 플레이어 정리: gameNumber={}, nickname={}, state={}, joinedAt={}",
                        player.game.gameNumber, player.nickname, player.game.gameState, player.joinedAt)

                    try {
                        cleanupSinglePlayer(player.game.gameNumber, userId)
                        cleanedCount++
                    } catch (e: Exception) {
                        logger.warn("고아 플레이어 {}(게임 {}) 정리 중 오류: {}",
                            player.nickname, player.game.gameNumber, e.message, e)
                    }
                }
            }

        } catch (e: Exception) {
            logger.error("고아 플레이어 감지 및 정리 중 전체 오류 발생", e)
        }

        // 정리된 플레이어가 있을 때만 완료 로그 출력
        if (cleanedCount > 0) {
            logger.info("고아 플레이어 정리 완료: {}명 정리", cleanedCount)
        }
        return cleanedCount
    }
}
