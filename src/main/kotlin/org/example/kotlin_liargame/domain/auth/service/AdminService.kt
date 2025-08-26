package org.example.kotlin_liargame.domain.auth.service

import io.micrometer.core.instrument.MeterRegistry
import org.example.kotlin_liargame.domain.auth.dto.request.AdminLoginRequest
import org.example.kotlin_liargame.domain.auth.dto.response.*
import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
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
            game.gameState == org.example.kotlin_liargame.domain.game.model.enum.GameState.WAITING ||
            game.gameState == org.example.kotlin_liargame.domain.game.model.enum.GameState.IN_PROGRESS
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
        
        game.gameState = org.example.kotlin_liargame.domain.game.model.enum.GameState.ENDED
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
        val oneDayAgo = Instant.now().minusSeconds(24 * 60 * 60)
        val staleWaitingGames = gameRepository.findByGameStateAndCreatedAtBefore(GameState.WAITING, oneDayAgo)

        // 3시간 이상 된 IN_PROGRESS 상태 게임들 정리 (비정상 종료된 게임들)
        val threeHoursAgo = Instant.now().minusSeconds(3 * 60 * 60)
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

    @Transactional
    fun cleanupEmptyGames(): Int {
        logger.debug("빈 게임방 정리 시작")

        // 플레이어가 없는 게임��들 찾기
        val allGames = gameRepository.findByGameStateNot(GameState.ENDED)
        val emptyGames = allGames.filter { game ->
            val playerCount = playerRepository.countByGame(game)
            playerCount == 0
        }

        emptyGames.forEach { game ->
            logger.debug("빈 게임방 삭제: gameNumber={}, state={}",
                game.gameNumber, game.gameState)

            // 게임 삭제 전에 해당 게임의 모든 채팅 메시지 삭제
            try {
                chatService.deleteGameChatMessages(game)
            } catch (e: Exception) {
                logger.warn("게임 {}의 채팅 메시지 삭제 중 오류: {}", game.gameNumber, e.message)
            }

            // 게임 삭제
            gameRepository.delete(game)

            // 모니터링 서비스에 알림
            gameMonitoringService.notifyRoomDeleted(game.gameNumber)
        }

        logger.debug("빈 게임방 정리 완료: {}개 삭제", emptyGames.size)
        return emptyGames.size
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
            if (userId != null) {
                // WebSocketSessionManager에서 해당 사용자의 활성 연결 확인
                val isConnected = try {
                    // 여기서는 단순히 게임에 참여한 지 오래된 플레이어들을 정리
                    val timeSinceJoined = java.time.Duration.between(player.joinedAt, java.time.Instant.now())
                    // 10분 이상 된 WAITING 상태 게임의 플레이어들을 정리 (연결이 끊어진 것으로 간주)
                    if (player.game.gameState == GameState.WAITING && timeSinceJoined.toMinutes() > 10) {
                        false
                    } else {
                        true
                    }
                } catch (e: Exception) {
                    logger.warn("플레이어 연결 상태 확인 중 오류: userId={}, error={}", userId, e.message)
                    false
                }

                if (!isConnected) {
                    logger.debug("고아 플레이어 정리: gameNumber={}, nickname={}, joinedAt={}",
                        player.game.gameNumber, player.nickname, player.joinedAt)

                    // 각 플레이어 정리를 별도 트랜잭션으로 처리하여 한 플레이어의 오류가 전체를 중단시키지 않도록 함
                    try {
                        cleanupSinglePlayer(player.game.gameNumber, userId)
                        cleanedCount++
                    } catch (e: Exception) {
                        logger.warn("플레이어 {}(게임 {}) 정리 중 오류: {}",
                            player.nickname, player.game.gameNumber, e.message, e)
                    }
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
}
