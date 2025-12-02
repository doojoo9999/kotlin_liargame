package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.request.CreateGameRoomRequest
import org.example.kotlin_liargame.domain.game.dto.response.GameRoomListResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.GameSubjectEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.GameSubjectRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.global.exception.UserAlreadyInGameException
import org.example.kotlin_liargame.global.exception.UserAlreadyOwnsGameException
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.example.kotlin_liargame.global.session.SessionService
import org.example.kotlin_liargame.tools.websocket.WebSocketSessionManager
import org.springframework.dao.DataIntegrityViolationException
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GameRoomService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val subjectRepository: SubjectRepository,
    private val gameSubjectRepository: GameSubjectRepository,
    private val sessionService: SessionService,
    private val sessionManagementService: SessionManagementService,
    private val webSocketSessionManager: WebSocketSessionManager,
    private val roomCodeGenerator: GameRoomCodeGenerator,
    private val gamePlayerService: GamePlayerService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @Transactional
    fun createGameRoom(request: CreateGameRoomRequest, session: HttpSession): Int {
        val nickname = sessionService.getCurrentUserNickname(session)
        val userId = sessionService.getCurrentUserId(session)
        logger.info("Creating game room for user {} (ID: {})", nickname, userId)

        validateExistingOwner(session)

        val selectedSubjects = selectSubjectsForGameRoom(request)

        var attempt = 0
        while (true) {
            val nextRoomNumber = roomCodeGenerator.nextRoomNumber()
            val newGame = request.to(nextRoomNumber, nickname)

            assignSubjects(newGame, selectedSubjects)

            try {
                val savedGame = gameRepository.save(newGame)
                persistGameSubjects(savedGame, selectedSubjects)

                val ownerPlayer = PlayerEntity(
                    game = savedGame,
                    userId = userId,
                    nickname = nickname,
                    isAlive = true,
                    role = PlayerRole.CITIZEN,
                    subject = savedGame.citizenSubject ?: throw IllegalStateException("게임에 시민 주제가 설정되지 않았습니다."),
                    state = PlayerState.WAITING_FOR_HINT
                )
                playerRepository.save(ownerPlayer)

                registerPlayerSession(userId, savedGame.gameNumber)
                logger.info("Game room {} created successfully", savedGame.gameNumber)

                return savedGame.gameNumber
            } catch (e: DataIntegrityViolationException) {
                attempt += 1
                logger.warn("Room number collision for {} (attempt {}). Retrying with new number.", nextRoomNumber, attempt)
                if (attempt >= MAX_ROOM_CREATE_RETRIES) {
                    logger.error("Failed to create unique game room after {} attempts", attempt, e)
                    throw e
                }
            }
        }
    }

    @Transactional(readOnly = true)
    fun getAllGameRooms(session: HttpSession): GameRoomListResponse {
        sessionService.getOptionalUserId(session) // touch session for authentication logging
        val activeGames = gameRepository.findAllActiveGames()
        val playerCounts = mutableMapOf<Long, Int>()
        val playersMap = mutableMapOf<Long, List<PlayerEntity>>()
        val gameSubjectsMap = mutableMapOf<Long, List<String>>()

        val filteredGames = activeGames.filter { game ->
            val players = playerRepository.findByGame(game)
            val gameSubjects = gameSubjectRepository.findByGameWithSubject(game)
            val subjectNames = gameSubjects.map { it.subject.content }

            playerCounts[game.id] = players.size
            playersMap[game.id] = players
            gameSubjectsMap[game.id] = subjectNames

            if (game.gameState == GameState.IN_PROGRESS) {
                return@filter true
            }

            if (game.gameState == GameState.WAITING) {
                val gameAge = java.time.Duration.between(game.createdAt, java.time.LocalDateTime.now())
                val lastActivity = game.lastActivityAt ?: game.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
                val inactiveTime = java.time.Duration.between(lastActivity, java.time.Instant.now())
                val isTrulyOrphaned = players.size == 1 && gameAge.toMinutes() > 15 && inactiveTime.toMinutes() > 10
                return@filter !isTrulyOrphaned
            }

            true
        }

        logger.info("Listing {} visible games out of {} active", filteredGames.size, activeGames.size)
        return GameRoomListResponse.from(filteredGames, playerCounts, playersMap, gameSubjectsMap)
    }

    private fun validateExistingOwner(session: HttpSession, performCleanup: Boolean = true) {
        val nickname = sessionService.getCurrentUserNickname(session)
        val userId = sessionService.getCurrentUserId(session)
        logger.debug("Validating existing owner for user {} ({})", nickname, userId)

        if (performCleanup) {
            runCatching { gamePlayerService.cleanupStaleGameData(userId, nickname) }
                .onFailure { logger.warn("Stale data cleanup failed for user {}: {}", nickname, it.message) }
        }

        val activeGameAsPlayer = playerRepository.findByUserIdAndGameActive(userId)
        if (activeGameAsPlayer != null) {
            throw UserAlreadyInGameException(nickname, activeGameAsPlayer.game.gameState)
        }

        val activeGameAsOwner = gameRepository.findByGameOwnerAndGameStateIn(
            nickname,
            listOf(GameState.WAITING, GameState.IN_PROGRESS)
        )

        if (activeGameAsOwner != null) {
            throw UserAlreadyOwnsGameException(nickname, activeGameAsOwner.gameNumber)
        }
    }

    private fun selectSubjectsForGameRoom(req: CreateGameRoomRequest): List<SubjectEntity> {
        val approvedSubjects = subjectRepository.findByStatus(ContentStatus.APPROVED)
            .filter { subject ->
                subject.word.count { word -> word.status == ContentStatus.APPROVED } >= 5
            }

        if (approvedSubjects.isEmpty()) {
            throw IllegalStateException("There are not enough approved subjects with at least 5 approved words to start a game.")
        }

        val selected = when {
            req.subjectIds != null -> req.subjectIds.mapNotNull { subjectId ->
                approvedSubjects.find { it.id == subjectId }
            }
            req.useRandomSubjects -> {
                val count = req.randomSubjectCount ?: 1
                approvedSubjects.shuffled().take(count.coerceAtMost(approvedSubjects.size))
            }
            else -> listOf(approvedSubjects.random())
        }

        return if (selected.isEmpty()) listOf(approvedSubjects.random()) else selected
    }

    private fun assignSubjects(game: GameEntity, subjects: List<SubjectEntity>) {
        if (subjects.isEmpty()) {
            throw IllegalStateException("게임 주제를 선택할 수 없습니다.")
        }

        val citizenSubject = subjects.first()
        game.citizenSubject = citizenSubject
        game.liarSubject = if (subjects.size > 1) subjects[1] else citizenSubject
    }

    private fun persistGameSubjects(game: GameEntity, subjects: List<SubjectEntity>) {
        subjects.forEach { subject ->
            gameSubjectRepository.save(GameSubjectEntity(game = game, subject = subject))
        }
    }

    private fun registerPlayerSession(userId: Long, gameNumber: Int) {
        runCatching { webSocketSessionManager.registerPlayerInGame(userId, gameNumber) }
            .onFailure { logger.warn("Failed to register WebSocket session for player {}: {}", userId, it.message) }
    }

    private companion object {
        private const val MAX_ROOM_CREATE_RETRIES = 3
    }
}
