package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.dto.request.CreateGameRoomRequest
import org.example.kotlin_liargame.domain.game.dto.request.EndOfRoundRequest
import org.example.kotlin_liargame.domain.game.dto.request.JoinGameRequest
import org.example.kotlin_liargame.domain.game.dto.request.LeaveGameRequest
import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.GameSubjectEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.*
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.GameSubjectRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerReadinessRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.example.kotlin_liargame.global.exception.GameAlreadyStartedException
import org.example.kotlin_liargame.global.exception.GameNotFoundException
import org.example.kotlin_liargame.global.exception.PlayerNotInGameException
import org.example.kotlin_liargame.global.exception.RoomFullException
import org.example.kotlin_liargame.tools.websocket.WebSocketSessionManager
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class GameService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val userRepository: UserRepository,
    private val subjectRepository: SubjectRepository,
    private val wordRepository: WordRepository,
    private val gameSubjectRepository: GameSubjectRepository,
    private val chatService: ChatService,
    private val gameMonitoringService: GameMonitoringService,
    private val defenseService: DefenseService,
    private val topicGuessService: TopicGuessService,
    private val webSocketSessionManager: WebSocketSessionManager,
    private val gameProperties: org.example.kotlin_liargame.global.config.GameProperties,
    private val sessionService: org.example.kotlin_liargame.global.session.SessionService,
    private val sessionManagementService: org.example.kotlin_liargame.global.security.SessionManagementService,
    private val playerReadinessRepository: PlayerReadinessRepository
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    private fun validateExistingOwner(session: HttpSession, performCleanup: Boolean = true) {
        val nickname = sessionService.getCurrentUserNickname(session)
        val userId = sessionService.getCurrentUserId(session)
        
        logger.debug("validateExistingOwner started for user: $nickname (ID: $userId)")

        // Optionally perform cleanup of stale data first
        if (performCleanup) {
            try {
                cleanupStaleGameData(userId, nickname)
                logger.debug("Stale data cleanup completed for user: $nickname")
            } catch (e: Exception) {
                logger.warn("Stale data cleanup failed for user $nickname: ${e.message}")
                // Continue with validation even if cleanup fails
            }
        }

        // First check if user is already a player in any active game (including WAITING)
        val activeGameAsPlayer = playerRepository.findByUserIdAndGameActive(userId)
        if (activeGameAsPlayer != null) {
            val gameState = activeGameAsPlayer.game.gameState
            logger.debug("User already in a game as player: gameId = ${activeGameAsPlayer.game.gameNumber}, state = $gameState")
            
            if (gameState == GameState.IN_PROGRESS) {
                throw RuntimeException("이미 진행중인 게임에 참여하고 있습니다.")
            } else {
                throw RuntimeException("이미 다른 게임방에 참여하고 있습니다. 기존 게임을 나간 후 다시 시도해주세요.")
            }
        }

        // Check if user owns any active games
        val activeGameAsOwner = gameRepository.findByGameOwnerAndGameStateIn(
            nickname,
            listOf(GameState.WAITING, GameState.IN_PROGRESS)
        )

        if (activeGameAsOwner != null) {
            logger.debug("User already owns an active game: gameId = ${activeGameAsOwner.gameNumber}, state = ${activeGameAsOwner.gameState}")

            // Only check for orphaned games in WAITING state
            if (activeGameAsOwner.gameState == GameState.WAITING) {
                val players = playerRepository.findByGame(activeGameAsOwner)
                
                // More lenient orphaned game criteria:
                // - Only owner exists (1 player)
                // - Game is older than 10 minutes (instead of 5)
                // - Or game has been inactive for more than 5 minutes
                val gameAge = java.time.Duration.between(activeGameAsOwner.createdAt, java.time.LocalDateTime.now())
                val lastActivity = activeGameAsOwner.lastActivityAt ?: activeGameAsOwner.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
                val inactiveTime = java.time.Duration.between(lastActivity, java.time.Instant.now())
                
                val isOrphaned = players.size == 1 && 
                               (gameAge.toMinutes() > 10 || inactiveTime.toMinutes() > 5)

                if (isOrphaned) {
                    logger.info("Found orphaned game during validation: gameNumber=${activeGameAsOwner.gameNumber}, " +
                              "age=${gameAge.toMinutes()}min, inactive=${inactiveTime.toMinutes()}min, cleaning up...")
                    
                    try {
                        // Use the existing cleanup method instead of manual cleanup
                        leaveGameAsSystem(activeGameAsOwner.gameNumber, userId)
                        logger.info("Successfully cleaned up orphaned game ${activeGameAsOwner.gameNumber} during validation")
                        
                        // Validation now passes - orphaned game has been cleaned up
                        logger.debug("validateExistingOwner passed for user: $nickname after orphaned game cleanup")
                        return
                        
                    } catch (e: Exception) {
                        logger.error("Failed to clean up orphaned game ${activeGameAsOwner.gameNumber}: ${e.message}", e)
                        // Don't throw exception if cleanup fails - just warn and continue validation
                        logger.warn("Continuing with validation despite cleanup failure for game ${activeGameAsOwner.gameNumber}")
                    }
                }

                // If not orphaned or cleanup failed, prevent creating new game
                throw RuntimeException("이미 참여중인 게임이 있습니다. 기존 게임을 나간 후 다시 시도해주세요.")
            } else {
                // Game is IN_PROGRESS
                throw RuntimeException("이미 진행중인 게임을 소유하고 있습니다.")
            }
        }

        logger.debug("validateExistingOwner passed for user: $nickname")
    }

    private fun findNextAvailableRoomNumber(): Int {
        val usedNumbers = gameRepository.findAllGameNumbers().toSet()

        for (number in 1..999) {
            if (!usedNumbers.contains(number)) {
                return number
            }
        }

        val nextNumber = (usedNumbers.maxOrNull() ?: 0) + 1
        if (nextNumber <= 999) {
            return nextNumber
        }

        throw RuntimeException("모든 방 번호(1-999)가 모두 사용중입니다. 나중에 다시 시도해주세요.")
    }

    @Transactional
    fun createGameRoom(req: CreateGameRoomRequest, session: HttpSession): Int {
        logger.info("=== CREATE GAME ROOM STARTED ===")
        
        try {
            val nickname = sessionService.getCurrentUserNickname(session)
            val userId = sessionService.getCurrentUserId(session)
            logger.info("Creating game room for user: $nickname (ID: $userId)")
            
            // Enhanced validation with better error messages
            try {
                validateExistingOwner(session)
                logger.debug("Validation passed for user: $nickname")
            } catch (e: RuntimeException) {
                logger.warn("Validation failed for user $nickname: ${e.message}")
                throw e
            }

            val nextRoomNumber = findNextAvailableRoomNumber()
            logger.debug("Next available room number: $nextRoomNumber")
            
            val newGame = req.to(nextRoomNumber, nickname)
            logger.debug("Created game entity: ${newGame.gameNumber}")

            val selectedSubjects = selectSubjectsForGameRoom(req)
            logger.debug("Selected ${selectedSubjects.size} subjects for game")
            
            if (selectedSubjects.isNotEmpty()) {
                val citizenSubject = selectedSubjects.first()
                newGame.citizenSubject = citizenSubject

                val liarSubject = if (selectedSubjects.size > 1) selectedSubjects[1] else citizenSubject
                newGame.liarSubject = liarSubject
                
                logger.debug("Assigned subjects - Citizen: ${citizenSubject.content}, Liar: ${liarSubject.content}")
            } else {
                logger.error("No subjects were selected for the game!")
                throw IllegalStateException("게임 주제를 선택할 수 없습니다.")
            }

            val savedGame = gameRepository.save(newGame)
            logger.debug("Game saved with ID: ${savedGame.id}")

            selectedSubjects.forEach { subject ->
                val gameSubject = GameSubjectEntity(
                    game = savedGame,
                    subject = subject
                )
                gameSubjectRepository.save(gameSubject)
            }
            logger.debug("Game subjects saved: ${selectedSubjects.size} records")

            // 방장을 자동으로 플레이어로 등록
            val ownerPlayer = PlayerEntity(
                game = savedGame,
                userId = userId,
                nickname = nickname,
                isAlive = true,
                role = PlayerRole.CITIZEN,
                subject = savedGame.citizenSubject ?: throw IllegalStateException("게임에 시민 주제가 설정되지 않았습니다."),
                state = PlayerState.WAITING_FOR_HINT
            )
            val savedPlayer = playerRepository.save(ownerPlayer)
            logger.debug("Owner player saved with ID: ${savedPlayer.id}")

            // WebSocket 세션에 방장의 게임 번호 등록
            try {
                webSocketSessionManager.registerPlayerInGame(userId, savedGame.gameNumber)
                logger.debug("WebSocket session registered for player {} in game {}", userId, savedGame.gameNumber)
            } catch (e: Exception) {
                logger.warn("Failed to register WebSocket session for player $userId: ${e.message}")
                // Don't fail game creation if WebSocket registration fails
            }

            logger.info("=== GAME ROOM CREATED SUCCESSFULLY: ${savedGame.gameNumber} ===")
            return savedGame.gameNumber
            
        } catch (e: Exception) {
            logger.error("=== GAME ROOM CREATION FAILED ===", e)
            throw e
        }
    }

    private fun selectSubjectsForGameRoom(req: CreateGameRoomRequest): List<SubjectEntity> {
        val allSubjects = subjectRepository.findByStatus(org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED)
        val validSubjects = allSubjects.filter { subject ->
            subject.word.count { word -> word.status == org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED } >= 5
        }

        if (validSubjects.isEmpty()) {
            throw IllegalStateException("There are not enough approved subjects with at least 5 approved words to start a game.")
        }

        val selectedSubjects = when {
            req.subjectIds != null -> {
                req.subjectIds.mapNotNull { subjectId ->
                    subjectRepository.findById(subjectId).orElse(null)
                }.filter { subject ->
                    subject.status == org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED &&
                            subject.word.count { word -> word.status == org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus.APPROVED } >= 5
                }
            }
            req.useRandomSubjects -> {
                val count = req.randomSubjectCount ?: 1
                val randomCount = count.coerceAtMost(validSubjects.size)
                validSubjects.shuffled().take(randomCount)
            }
            else -> {
                listOf(validSubjects.random())
            }
        }

        if (selectedSubjects.isEmpty()) {
            return listOf(validSubjects.random())
        }

        return selectedSubjects
    }

    @Transactional
    fun joinGame(req: JoinGameRequest, session: HttpSession): GameStateResponse {
        logger.debug("=== Join Game Request Debug ===")
        logger.debug("Game Number: ${req.gameNumber}")
        logger.debug("Session ID: ${session.id}")

        // JSON 직렬화 방식으로 세션 정보 조회
        val userId = sessionService.getOptionalUserId(session)
        val nickname = sessionService.getOptionalUserNickname(session)
        logger.debug("Session userId: $userId, nickname: $nickname")

        val game = gameRepository.findByGameNumberWithLock(req.gameNumber)
            ?: throw GameNotFoundException(req.gameNumber)

        if (game.gameState != GameState.WAITING) {
            throw GameAlreadyStartedException(req.gameNumber)
        }

        val currentPlayers = playerRepository.findByGame(game)
        if (currentPlayers.size >= game.gameParticipants) {
            throw RoomFullException(req.gameNumber)
        }

        try {
            val currentUserId = sessionService.getCurrentUserId(session)
            val currentNickname = sessionService.getCurrentUserNickname(session)
            logger.debug("Successfully retrieved session info: userId=$currentUserId, nickname=$currentNickname")

            // 🔧 세션 갱신 로직 추가: 게임 참여 시점에서 세션을 최신 상태로 갱신
            try {
                logger.debug("Refreshing session for user: $currentNickname (ID: $currentUserId)")
                val sessionValidationResult = sessionManagementService.validateSession(session)

                if (sessionValidationResult != org.example.kotlin_liargame.global.security.SessionValidationResult.VALID) {
                    logger.warn("Session validation failed during joinGame: $sessionValidationResult")
                    // 세션이 유효하지 않아도 현재 로직을 계속 진행 (이미 인증된 상태이므로)
                }

                logger.debug("Session refreshed successfully for user: $currentNickname")
            } catch (e: Exception) {
                logger.warn("Session refresh failed, but continuing with current session: ${e.message}")
                // 세션 갱신 실패해도 게임 참여는 계속 진행
            }

            val existingPlayer = playerRepository.findByGameAndUserId(game, currentUserId)
            if (existingPlayer != null) {
                // 기존 플레이어의 게임 관련 세션 데이터 설정
                val isOwner = game.gameOwner == currentNickname
                sessionManagementService.updateGameSession(session, req.gameNumber, isOwner, if (isOwner) "OWNER" else "PLAYER")

                // 기존 플레이어도 WebSocket 세션에 게임 번호 등록
                webSocketSessionManager.registerPlayerInGame(currentUserId, req.gameNumber)
                logger.debug("Existing player found and WebSocket session updated: userId=$currentUserId, gameNumber=${req.gameNumber}")
                return getGameState(game, session)
            }

            val newPlayer = joinGame(game, currentUserId, currentNickname)

            // 새 플레이어의 게임 관련 세션 데이터 설정
            val isOwner = game.gameOwner == currentNickname
            sessionManagementService.updateGameSession(session, req.gameNumber, isOwner, if (isOwner) "OWNER" else "PLAYER")

            // WebSocket 세션에 플레이어의 게임 번호 등록
            webSocketSessionManager.registerPlayerInGame(currentUserId, req.gameNumber)
            logger.debug("Registered player {} in game {} for WebSocket session management", currentUserId, req.gameNumber)

            val allPlayers = playerRepository.findByGame(game)
            gameMonitoringService.notifyPlayerJoined(game, newPlayer, allPlayers)

            return getGameState(game, session)
        } catch (e: RuntimeException) {
            logger.error("Session authentication failed during join game: ${e.message}")
            logger.error("Available session attributes: ${session.attributeNames.toList()}")
            throw RuntimeException("세션 인증에 실패했습니다. 다시 로그인해주세요: ${e.message}")
        }
    }

    private fun joinGame(game: GameEntity, userId: Long, nickname: String): PlayerEntity {
        val player = PlayerEntity(
            game = game,
            userId = userId,
            nickname = nickname,
            isAlive = true,
            role = PlayerRole.CITIZEN,
            subject = game.citizenSubject ?: throw IllegalStateException("게임에 시민 주제가 설정되지 않았습니다."),
            state = PlayerState.WAITING_FOR_HINT,
            votesReceived = 0,
            hint = null,
            defense = null,
            votedFor = null
        )

        // 게임 참가 시 마지막 활동 시간 업데이트 (부재 시간 초기화)
        game.lastActivityAt = java.time.Instant.now()
        gameRepository.save(game)

        return playerRepository.save(player)
    }

    @Transactional
    fun leaveGame(req: LeaveGameRequest, session: HttpSession): Boolean {
        val game = gameRepository.findByGameNumberWithLock(req.gameNumber)
            ?: throw GameNotFoundException(req.gameNumber)

        val userId = sessionService.getCurrentUserId(session)
        val nickname = sessionService.getCurrentUserNickname(session)

        // 플레이어 정보를 먼저 조회하여 ID를 획득
        val player = playerRepository.findByGameAndUserId(game, userId)
        if (player == null) {
            logger.debug("Player not found in game ${game.gameNumber} for user $userId")
            return false
        }

        // 플레이어의 채팅 메시지를 먼저 삭제하여 외래키 제약 조건 위반 방지
        try {
            val archivedCount = chatService.archivePlayerChatMessages(player.userId, player.nickname)
            logger.debug("Archived $archivedCount chat messages for player userId=${player.userId} (pk=${player.id}) in game ${game.gameNumber}")
        } catch (e: Exception) {
            logger.error("Failed to archive chat messages for player userId=${player.userId} (pk=${player.id}): ${e.message}", e)
            throw RuntimeException("채팅 기록 보관 중 오류가 발생했습니다: ${e.message}")
        }

        // 이제 플레이어를 안전하게 삭제
        val deletedCount = playerRepository.deleteByGameIdAndUserId(game.id, userId)

        if (deletedCount > 0) {
            val readinessDeleted = playerReadinessRepository.deleteByGameAndUserId(game, userId)
            if (readinessDeleted > 0) {
                logger.debug("Removed {} readiness records for player {} in game {}", readinessDeleted, userId, game.gameNumber)
            }
        }

        if (deletedCount > 0) {
            // 🔧 게임 나가기 후 세션 갱신: 게임 관련 세션 데이터 정리
            try {
                logger.debug("Refreshing session after leaving game for user: $nickname (ID: $userId)")

                // 게임 관련 세션 데이터 정리
                sessionManagementService.updateGameSession(session, null, false, null)

                // 세션 활동 시간 갱신
                val sessionValidationResult = sessionManagementService.validateSession(session)
                if (sessionValidationResult != org.example.kotlin_liargame.global.security.SessionValidationResult.VALID) {
                    logger.warn("Session validation failed during leaveGame: $sessionValidationResult")
                }

                logger.debug("Session refreshed successfully after leaving game for user: $nickname")
            } catch (e: Exception) {
                logger.warn("Session refresh failed during leaveGame, but continuing: ${e.message}")
                // 세션 갱신 실패해도 게임 나가기는 계속 진행
            }

            // WebSocket 세션에서 플레이어 제거
            webSocketSessionManager.removePlayerFromGame(userId)
            logger.debug("Removed player {} from WebSocket session management", userId)

            val remainingPlayers = playerRepository.findByGame(game)

            val wasOwner = game.gameOwner == nickname

            if (remainingPlayers.isEmpty()) {
                logger.debug("No players remaining, deleting room ${game.gameNumber}")

                try {
                    chatService.deleteGameChatMessages(game)

                    val gameSubjects = gameSubjectRepository.findByGame(game)
                    if (gameSubjects.isNotEmpty()) {
                        gameSubjectRepository.deleteAll(gameSubjects)
                        logger.debug("Deleted ${gameSubjects.size} game_subject records for game ${game.gameNumber}")
                    }

                    gameRepository.delete(game)
                    gameMonitoringService.notifyRoomDeleted(game.gameNumber)
                    logger.debug("Successfully deleted game ${game.gameNumber}")
                } catch (e: Exception) {
                    logger.error("Failed to delete game ${game.gameNumber}: ${e.message}", e)
                    throw RuntimeException("게임방 삭제 중 오류가 발생했습니다: ${e.message}")
                }

                return true
            } else if (wasOwner) {
                val newOwner = remainingPlayers.minByOrNull { it.joinedAt }
                if (newOwner != null) {
                    game.gameOwner = newOwner.nickname
                    gameRepository.save(game)
                    logger.debug("Transferred ownership from $nickname to ${newOwner.nickname} in room ${game.gameNumber} (joined at: ${newOwner.joinedAt})")
                }
            }

            gameMonitoringService.notifyPlayerLeft(game, player, remainingPlayers)

            return true
        }

        return false
    }

    fun getGameState(req: Int, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumber(req)
            ?: throw GameNotFoundException(req)

        return getGameState(game, session)
    }

    fun getGameResult(req: Int, session: HttpSession): GameResultResponse {
        val game = gameRepository.findByGameNumber(req)
            ?: throw GameNotFoundException(req)

        if (game.gameState != GameState.ENDED) {
            throw RuntimeException("Game is not ended")
        }

        val players = playerRepository.findByGame(game)
        val winningTeam = game.winningTeam
            ?: when {
                players.any { it.isWinner && it.role == PlayerRole.LIAR } -> WinningTeam.LIARS
                players.any { it.isWinner && it.role == PlayerRole.CITIZEN } -> WinningTeam.CITIZENS
                else -> {
                    val liarsAlive = players.any { it.role == PlayerRole.LIAR && it.isAlive }
                    if (liarsAlive) WinningTeam.LIARS else WinningTeam.CITIZENS
                }
            }

        return GameResultResponse.from(
            game = game,
            players = players,
            winningTeam = winningTeam,
            correctGuess = game.liarGuessCorrect
        )
    }

    fun getAllGameRooms(session: HttpSession): GameRoomListResponse {
        val activeGames = gameRepository.findAllActiveGames()

        val playerCounts = mutableMapOf<Long, Int>()
        val playersMap = mutableMapOf<Long, List<PlayerEntity>>()
        val gameSubjectsMap = mutableMapOf<Long, List<String>>()

        // Process all active games and apply more lenient filtering
        val filteredGames = activeGames.filter { game ->
            val players = playerRepository.findByGame(game)
            val gameSubjects = gameSubjectRepository.findByGameWithSubject(game)
            val subjectNames = gameSubjects.map { it.subject.content }

            logger.debug("Game ${game.gameNumber} (ID: ${game.id}): found ${players.size} players, state=${game.gameState}")
            players.forEach { player ->
                logger.debug("  - Player: ${player.nickname} (userId=${player.userId}, pk=${player.id})")
            }
            logger.debug("Game ${game.gameNumber} subjects: $subjectNames")

            playerCounts[game.id] = players.size
            playersMap[game.id] = players
            gameSubjectsMap[game.id] = subjectNames

            // More lenient filtering criteria:
            // 1. Always show IN_PROGRESS games
            // 2. For WAITING games, only filter if:
            //    - Single player AND game is older than 15 minutes (increased from 5)
            //    - OR game has been inactive for more than 10 minutes
            if (game.gameState == GameState.IN_PROGRESS) {
                logger.debug("Including IN_PROGRESS game ${game.gameNumber}")
                return@filter true
            }

            if (game.gameState == GameState.WAITING) {
                // Check if game should be considered truly orphaned
                val gameAge = java.time.Duration.between(game.createdAt, java.time.LocalDateTime.now())
                val lastActivity = game.lastActivityAt ?: game.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
                val inactiveTime = java.time.Duration.between(lastActivity, java.time.Instant.now())
                
                val isTrulyOrphaned = players.size == 1 && 
                                     gameAge.toMinutes() > 15 && 
                                     inactiveTime.toMinutes() > 10

                if (isTrulyOrphaned) {
                    logger.warn("Filtering out truly orphaned game ${game.gameNumber} " +
                              "(age: ${gameAge.toMinutes()}min, inactive: ${inactiveTime.toMinutes()}min)")
                    return@filter false
                }

                // Show all other WAITING games
                logger.debug("Including WAITING game ${game.gameNumber} " +
                           "(players: ${players.size}, age: ${gameAge.toMinutes()}min)")
                return@filter true
            }

            // Show all other games (shouldn't reach here, but safe default)
            return@filter true
        }

        logger.info("Game room listing: Active games: ${activeGames.size}, Visible games: ${filteredGames.size}")
        
        if (filteredGames.isEmpty() && activeGames.isNotEmpty()) {
            logger.warn("All games were filtered out! This might indicate an issue with filtering logic.")
            logger.debug("Original active games: ${activeGames.map { "${it.gameNumber}(${it.gameState})" }}")
        }

        return GameRoomListResponse.from(filteredGames, playerCounts, playersMap, gameSubjectsMap)
    }

    @Transactional
    fun endOfRound(req: EndOfRoundRequest, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw GameNotFoundException(req.gameNumber)

        if (game.gameState != GameState.IN_PROGRESS) {
            throw GameAlreadyStartedException(req.gameNumber)
        }

        if (game.gameOwner != req.gameOwner) {
            throw RuntimeException("Only the game owner can end the round")
        }

        if (game.gameCurrentRound != req.gameRound) {
            throw RuntimeException("Round number mismatch")
        }

        if (req.isGameOver) {
            game.endGame()
            gameRepository.save(game)
        }

        chatService.startPostRoundChat(req.gameNumber)

        return getGameState(game, session)
    }

    @Transactional
    fun recoverGameState(gameNumber: Int, userId: Long): GameRecoveryResponse {
        logger.debug("Starting game state recovery for game {} and user {}", gameNumber, userId)

        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw PlayerNotInGameException(userId, gameNumber)

        val players = playerRepository.findByGame(game)
        logger.debug("Found {} players in game {}", players.size, gameNumber)

        val defenseRecovery = defenseService.recoverGameState(gameNumber)
        val accusedPlayer = findAccusedPlayer(players)

        // Get turn order information
        val turnOrder = game.turnOrder?.split(',')?.filter { it.isNotBlank() }

        // Get current phase
        val currentPhase = determineGamePhase(game, players)
        logger.debug("Current phase for game {}: {}", gameNumber, currentPhase)

        // Generate final voting record from player states
        val finalVotingRecord = players
            .filter { it.finalVote != null }
            .map { FinalVoteResponse(
                gameNumber = gameNumber,
                // FinalVoteResponse.voterPlayerId는 userId를 담아야 함
                voterPlayerId = it.userId,
                voterNickname = it.nickname,
                voteForExecution = it.finalVote ?: false,
                success = true,
                message = null
            ) }
        logger.debug("Generated {} final voting records for game {}", finalVotingRecord.size, gameNumber)

        return GameRecoveryResponse(
            gameNumber = gameNumber,
            gameState = game.gameState.name,
            scoreboard = players.map { ScoreboardEntry.from(it) },
            targetPoints = game.targetPoints,
            finalVotingRecord = finalVotingRecord,
            currentPhase = currentPhase,
            phaseEndTime = game.phaseEndTime?.toString(),
            // accusedPlayerId는 userId를 반환해야 함
            accusedPlayerId = accusedPlayer?.userId,
            accusedNickname = accusedPlayer?.nickname,
            currentAccusationTargetId = game.accusedPlayerId,
            gameCurrentRound = game.gameCurrentRound,
            turnOrder = turnOrder,
            currentTurnIndex = game.currentTurnIndex,
            defenseReentryCount = 0, // TODO: Implement defense reentry count tracking
            recentSystemHeadline = null, // TODO: Implement recent system headline
            defense = defenseRecovery,
            player = GameRecoveryResponse.PlayerInfo(
                id = player.id,
                nickname = player.nickname,
                isAlive = player.isAlive,
                role = player.role.name
            ),
            timestamp = java.time.Instant.now().toString()
        )
    }

    private fun getGameState(game: GameEntity, session: HttpSession?): GameStateResponse {
        val players = playerRepository.findByGame(game)

        // 인증이 없어도 상태 조회는 허용: 없으면 null
        val currentUserId = sessionService.getOptionalUserId(session)

        // 실제 게임의 currentPhase를 우선적으로 사용하고, null인 경우에만 계산
        val currentPhase = determineGamePhase(game, players)
        println("[GameService] getGameState - Game ${game.gameNumber}: actualPhase=${game.currentPhase}, calculatedPhase=${determineGamePhase(game, players)}, finalPhase=$currentPhase")

        val accusedPlayer = findAccusedPlayer(players)

        val currentPlayer = currentUserId?.let { uid -> players.find { p -> p.userId == uid } }
        val isChatAvailable = if (currentPlayer != null) {
            chatService.isChatAvailable(game, currentPlayer)
        } else {
            false
        }

        // turnOrder 정보 추가
        val turnOrder = game.turnOrder?.split(',')?.filter { it.isNotBlank() }
        val currentTurnIndex = game.currentTurnIndex

        return GameStateResponse.from(
            game = game,
            players = players,
            currentUserId = currentUserId,
            currentPhase = currentPhase,
            accusedPlayer = accusedPlayer,
            isChatAvailable = isChatAvailable,
            turnOrder = turnOrder,
            currentTurnIndex = currentTurnIndex,
            phaseEndTime = game.phaseEndTime?.toString(),
            winner = game.winningTeam?.name,
            winningTeam = game.winningTeam?.name,
            reason = game.winnerReason
        )
    }

    private fun determineGamePhase(game: GameEntity, players: List<PlayerEntity>): GamePhase {
        return when (game.gameState) {
            GameState.WAITING -> GamePhase.WAITING_FOR_PLAYERS
            GameState.ENDED -> GamePhase.GAME_OVER
            GameState.IN_PROGRESS -> {
                if (topicGuessService.isGuessingPhaseActive(game.gameNumber)) {
                    return GamePhase.GUESSING_WORD
                }

                val allPlayersGaveHints = players.all { it.state == PlayerState.GAVE_HINT || !it.isAlive }
                val allPlayersVoted = players.all { it.state == PlayerState.VOTED || !it.isAlive }
                val accusedPlayer = findAccusedPlayer(players)

                when {
                    accusedPlayer?.state == PlayerState.ACCUSED -> GamePhase.DEFENDING
                    accusedPlayer?.state == PlayerState.DEFENDED -> GamePhase.VOTING_FOR_SURVIVAL
                    allPlayersVoted -> GamePhase.VOTING_FOR_LIAR
                    allPlayersGaveHints -> GamePhase.VOTING_FOR_LIAR
                    else -> GamePhase.SPEECH  // GIVING_HINTS 대신 SPEECH 사용
                }
            }
        }
    }

    private fun findAccusedPlayer(players: List<PlayerEntity>): PlayerEntity? {
        return players.find { it.state == PlayerState.ACCUSED || it.state == PlayerState.DEFENDED }
    }

    fun findPlayerInActiveGame(userId: Long): PlayerEntity? {
        return playerRepository.findByUserIdAndGameActive(userId)
    }

    @Transactional
    fun cleanupPlayerByUserId(userId: Long) {
        try {
            val player = playerRepository.findByUserIdAndGameActive(userId)
            if (player != null) {
                val gameNumber = player.game.gameNumber
                leaveGameAsSystem(gameNumber, userId)
                println("[GameService] Successfully cleaned up player by userId: $userId from game: $gameNumber")
            } else {
                println("[GameService] No active game player found for userId: $userId")
            }
        } catch (e: Exception) {
            println("[GameService] Error during player cleanup for userId: $userId - ${e.message}")
        }
    }

    @Transactional
    fun leaveGameAsSystem(gameNumber: Int, userId: Long) {
        val game = gameRepository.findByGameNumberWithLock(gameNumber) ?: return
        val player = playerRepository.findByGameAndUserId(game, userId) ?: return

        // 플레이어 삭제 전에 해당 플레이어의 채팅 메시지들을 먼저 정리
        logger.debug("플레이어 삭제 전 채팅 메시지 정리: userId={}, nickname={}, pk={}", player.userId, player.nickname, player.id)
        chatService.archivePlayerChatMessages(player.userId, player.nickname)

        playerRepository.delete(player)
        val readinessDeleted = playerReadinessRepository.deleteByGameAndUserId(game, userId)
        if (readinessDeleted > 0) {
            logger.debug("System cleanup removed {} readiness records for user {} in game {}", readinessDeleted, userId, game.gameNumber)
        }

        val remainingPlayers = playerRepository.findByGame(game)
        if (remainingPlayers.isEmpty()) {
            // 게임 삭제 전에 해당 게임의 모든 채팅 메시지도 삭제
            logger.debug("게임 삭제 전 모든 채팅 메시지 정리: gameNumber={}", game.gameNumber)
            chatService.deleteGameChatMessages(game)

            // 게임 삭제 전에 game_subject 테이블의 관련 레코드들을 먼저 삭제
            logger.debug("게임 삭제 전 game_subject 관계 정리: gameNumber={}", game.gameNumber)
            val gameSubjects = gameSubjectRepository.findByGame(game)
            if (gameSubjects.isNotEmpty()) {
                gameSubjectRepository.deleteAll(gameSubjects)
                logger.debug("game_subject 레코드 {}개 삭제됨", gameSubjects.size)
            }

            gameRepository.delete(game)
            gameMonitoringService.notifyRoomDeleted(game.gameNumber, reason = "NO_PLAYERS_REMAIN")
        } else {
            if (game.gameOwner == player.nickname) {
                val newOwner = remainingPlayers.minByOrNull { it.joinedAt }
                newOwner?.let {
                    game.gameOwner = it.nickname
                    gameRepository.save(game)
                }
            }
            gameMonitoringService.notifyPlayerLeft(game, player, remainingPlayers)
        }
    }

    @Transactional
    fun handlePlayerDisconnection(userId: Long) {
        val player = playerRepository.findByUserIdAndGameActive(userId)
        player?.let {
            logger.debug(
                "플레이어 연결 해제 처리: userId={}, gameNumber={}, nickname={}",
                userId,
                it.game.gameNumber,
                it.nickname
            )

            it.isOnline = false
            it.lastActiveAt = Instant.now()
            playerRepository.save(it)

            gameMonitoringService.notifyPlayerConnectionChanged(it.game, it, isConnected = false)
        }
    }

    @Transactional
    fun handlePlayerReconnection(userId: Long) {
        val player = playerRepository.findByUserIdAndGameActive(userId)
        player?.let {
            logger.debug(
                "플레이어 재연결 처리: userId={}, gameNumber={}, nickname={}",
                userId,
                it.game.gameNumber,
                it.nickname
            )

            it.isOnline = true
            it.lastActiveAt = Instant.now()
            playerRepository.save(it)

            gameMonitoringService.notifyPlayerConnectionChanged(it.game, it, isConnected = true)
        }
    }

    /**
     * 방장 강퇴 및 권한 이양
     * 시간 초과로 인해 방장을 강퇴하고 다음 플레이어에게 권한을 이양합니다.
     */
    @Transactional
    fun kickOwnerAndTransferOwnership(gameNumber: Int): OwnerKickResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("존재하지 않는 게임방입니다.")

        if (game.gameState != GameState.WAITING) {
            throw IllegalArgumentException("대기 중인 게임방에서만 방장 강퇴가 가능합니다.")
        }

        // countByGame 사용으로 성능 개선
        val playerCount = playerRepository.countByGame(game)
        if (playerCount < 2) {
            throw IllegalArgumentException("플레이어가 2명 이상 있어야 방장 강퇴가 가능합니다.")
        }

        val players = playerRepository.findByGame(game)
        // 현재 방장 찾기
        val currentOwner = players.find { it.nickname == game.gameOwner }
            ?: throw IllegalArgumentException("현재 방장을 찾을 수 없습니다.")

        // 다음 방장 결정 (가장 먼저 입장한 플레이어, 현재 방장 제외)
        val nextOwner = players
            .filter { it.nickname != game.gameOwner }
            .minByOrNull { it.joinedAt }
            ?: throw IllegalArgumentException("새로운 방장을 선정할 수 없습니다.")

        logger.info("방장 강퇴 및 권한 이양: 게임={}, 기존방장={}, 새방장={}",
            gameNumber, currentOwner.nickname, nextOwner.nickname)

        // 방장 권한 이양
        val oldOwnerNickname = game.gameOwner
        game.gameOwner = nextOwner.nickname
        gameRepository.save(game)

        // 기존 방장 플레이어 삭제
        chatService.archivePlayerChatMessages(currentOwner.userId, currentOwner.nickname)
        playerRepository.delete(currentOwner)

        // 모든 플레이어에게 알림
        val message = mapOf(
            "type" to "OWNER_KICKED_AND_TRANSFERRED",
            "kickedOwner" to oldOwnerNickname,
            "newOwner" to nextOwner.nickname,
            "message" to "${oldOwnerNickname}님이 시간 내에 게임을 시작하지 않아 강퇴되었습니다. 새로운 방장은 ${nextOwner.nickname}님입니다."
        )
        gameMonitoringService.broadcastGameState(game, message)

        // 채팅으로도 알림
        chatService.sendSystemMessage(game, "${oldOwnerNickname}님이 방장 권한을 박탈당했습니다. 새로운 방장: ${nextOwner.nickname}님")

        return OwnerKickResponse(
            newOwner = nextOwner.nickname,
            kickedPlayer = oldOwnerNickname,
            gameNumber = gameNumber
        )
    }

    /**
     * 게임 시작 시간 연장
     * 방장이 게임 시작 시간을 5분 연장합니다.
     */
    @Transactional
    fun cleanupStaleGameData(userId: Long, nickname: String): Boolean {
        logger.info("Starting stale game data cleanup for user: $nickname (ID: $userId)")
        
        try {
            // Find any stale games owned by this user
            val staleOwnedGames = gameRepository.findByGameOwnerAndGameStateIn(
                nickname,
                listOf(GameState.WAITING, GameState.IN_PROGRESS)
            )
            
            if (staleOwnedGames != null) {
                val gameAge = java.time.Duration.between(staleOwnedGames.createdAt, java.time.LocalDateTime.now())
                val lastActivity = staleOwnedGames.lastActivityAt ?: staleOwnedGames.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
                val inactiveTime = java.time.Duration.between(lastActivity, java.time.Instant.now())
                
                logger.info("Found owned game ${staleOwnedGames.gameNumber} - age: ${gameAge.toMinutes()}min, inactive: ${inactiveTime.toMinutes()}min")
                
                // Clean up if game is old or inactive
                if (gameAge.toMinutes() > 5 || inactiveTime.toMinutes() > 3) {
                    logger.info("Cleaning up stale owned game ${staleOwnedGames.gameNumber}")
                    leaveGameAsSystem(staleOwnedGames.gameNumber, userId)
                }
            }
            
            // Find any games where user is a player
            val stalePlayerGame = playerRepository.findByUserIdAndGameActive(userId)
            if (stalePlayerGame != null) {
                val game = stalePlayerGame.game
                val gameAge = java.time.Duration.between(game.createdAt, java.time.LocalDateTime.now())
                val lastActivity = game.lastActivityAt ?: game.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
                val inactiveTime = java.time.Duration.between(lastActivity, java.time.Instant.now())
                
                logger.info("Found player game ${game.gameNumber} - age: ${gameAge.toMinutes()}min, inactive: ${inactiveTime.toMinutes()}min")
                
                // Clean up if game is old or inactive
                if (gameAge.toMinutes() > 5 || inactiveTime.toMinutes() > 3) {
                    logger.info("Cleaning up stale player participation in game ${game.gameNumber}")
                    leaveGameAsSystem(game.gameNumber, userId)
                }
            }
            
            logger.info("Stale game data cleanup completed for user: $nickname")
            return true
            
        } catch (e: Exception) {
            logger.error("Error during stale game data cleanup for user $nickname: ${e.message}", e)
            return false
        }
    }

    @Transactional
    fun extendGameStartTime(gameNumber: Int, userId: Long?): TimeExtensionResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("존재하지 않는 게임방입니다.")

        if (game.gameState != GameState.WAITING) {
            throw IllegalArgumentException("대기 중인 게임방에서만 시간 연장이 가능합니다.")
        }

        // 방장 권한 확인
        if (userId != null) {
            val user = userRepository.findById(userId).orElse(null)
            if (user?.nickname != game.gameOwner) {
                throw IllegalArgumentException("방장만 시간을 연장할 수 있습니다.")
            }
        }

        // 게임 시작 시간 연장 (createdAt 대신 gameStartDeadline 사용)

        if (game.gameStartDeadline == null) {
            // 첫 번째 연장인 경우 - 생성 시간에서 20분 + 연장시간
            // LocalDateTime을 Instant로 변환
            val createdAtInstant = game.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
            game.gameStartDeadline = createdAtInstant.plusSeconds((20 + gameProperties.sessionExtensionMinutes) * 60)
        } else {
            // 이미 연장된 경우 - 기존 데드라인에서 연장
            game.gameStartDeadline = game.gameStartDeadline!!.plusSeconds(gameProperties.sessionExtensionMinutes * 60)
        }

        // nullable 필드 안전하게 처리
        game.timeExtensionCount = (game.timeExtensionCount ?: 0) + 1
        gameRepository.save(game)

        val extendedUntil = game.gameStartDeadline!!

        logger.info("게임 시작 시간 연장: 게임={}, 연장된 시간={}, 연장 횟수={}", gameNumber, extendedUntil, game.timeExtensionCount)

        // 모든 플레이어에게 알림
        val message = mapOf(
            "type" to "TIME_EXTENDED",
            "extendedUntil" to extendedUntil.toString(),
            "message" to "게임 시작 시간이 5분 연장되었습니다."
        )
        gameMonitoringService.broadcastGameState(game, message)

        // 채팅으로도 알림
        chatService.sendSystemMessage(game, "방장이 게임 시작 시간을 연장했습니다. (+5분)")

        return TimeExtensionResponse(
            extendedUntil = extendedUntil.toString(),
            gameNumber = gameNumber
        )
    }
}
