package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.dto.request.EndOfRoundRequest
import org.example.kotlin_liargame.domain.game.dto.response.*
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.*
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.global.config.GameProperties
import org.example.kotlin_liargame.global.exception.*
import org.example.kotlin_liargame.global.session.SessionService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GamePlayService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val userRepository: UserRepository,
    private val chatService: ChatService,
    private val defenseService: DefenseService,
    private val topicGuessService: TopicGuessService,
    private val gameMonitoringService: GameMonitoringService,
    private val sessionService: SessionService,
    private val gameProperties: GameProperties
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @Transactional(readOnly = true)
    fun getGameState(gameNumber: Int, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        return buildGameState(game, session)
    }

    internal fun buildGameState(game: GameEntity, session: HttpSession?): GameStateResponse {
        val players = playerRepository.findByGame(game)
        val currentUserId = sessionService.getOptionalUserId(session)
        val currentPhase = determineGamePhase(game, players)
        val accusedPlayer = findAccusedPlayer(players)
        val currentPlayer = currentUserId?.let { uid -> players.find { it.userId == uid } }
        val isChatAvailable = currentPlayer?.let { chatService.isChatAvailable(game, it) } ?: false
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

    @Transactional(readOnly = true)
    fun getGameResult(gameNumber: Int): GameResultResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        if (game.gameState != GameState.ENDED) {
            throw GameStateUnavailableException()
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

    @Transactional
    fun endOfRound(request: EndOfRoundRequest, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumber(request.gameNumber)
            ?: throw GameNotFoundException(request.gameNumber)

        if (game.gameState != GameState.IN_PROGRESS) {
            throw GameAlreadyStartedException(request.gameNumber)
        }

        if (game.gameOwner != request.gameOwner) {
            throw GameOwnerOnlyActionException()
        }

        if (game.gameCurrentRound != request.gameRound) {
            throw GameRoundMismatchException(game.gameCurrentRound, request.gameRound)
        }

        if (request.isGameOver) {
            game.endGame()
            gameRepository.save(game)
        }

        chatService.startPostRoundChat(request.gameNumber)

        return buildGameState(game, session)
    }

    @Transactional(readOnly = true)
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
        val turnOrder = game.turnOrder?.split(',')?.filter { it.isNotBlank() }
        val currentPhase = determineGamePhase(game, players)

        val finalVotingRecord = players
            .filter { it.finalVote != null }
            .map {
                FinalVoteResponse(
                    gameNumber = gameNumber,
                    voterPlayerId = it.userId,
                    voterNickname = it.nickname,
                    voteForExecution = it.finalVote ?: false,
                    success = true,
                    message = null
                )
            }
        logger.debug("Generated {} final voting records for game {}", finalVotingRecord.size, gameNumber)

        return GameRecoveryResponse(
            gameNumber = gameNumber,
            gameState = game.gameState.name,
            scoreboard = players.map { ScoreboardEntry.from(it) },
            targetPoints = game.targetPoints,
            finalVotingRecord = finalVotingRecord,
            currentPhase = currentPhase,
            phaseEndTime = game.phaseEndTime?.toString(),
            accusedPlayerId = accusedPlayer?.userId,
            accusedNickname = accusedPlayer?.nickname,
            currentAccusationTargetId = game.accusedPlayerId,
            gameCurrentRound = game.gameCurrentRound,
            turnOrder = turnOrder,
            currentTurnIndex = game.currentTurnIndex,
            defenseReentryCount = 0,
            recentSystemHeadline = null,
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

    @Transactional
    fun extendGameStartTime(gameNumber: Int, userId: Long?): TimeExtensionResponse {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw GameNotFoundException(gameNumber)

        if (game.gameState != GameState.WAITING) {
            throw IllegalArgumentException("대기 중인 게임방에서만 시간 연장이 가능합니다.")
        }

        if (userId != null) {
            val user = userRepository.findById(userId).orElse(null)
            if (user?.nickname != game.gameOwner) {
                throw GameOwnerOnlyActionException()
            }
        }

        if (game.gameStartDeadline == null) {
            val createdAtInstant = game.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant()
            game.gameStartDeadline = createdAtInstant.plusSeconds((20 + gameProperties.sessionExtensionMinutes) * 60)
        } else {
            game.gameStartDeadline = game.gameStartDeadline!!.plusSeconds(gameProperties.sessionExtensionMinutes * 60)
        }

        game.timeExtensionCount = (game.timeExtensionCount ?: 0) + 1
        gameRepository.save(game)

        val extendedUntil = game.gameStartDeadline!!
        logger.info(
            "게임 시작 시간 연장: 게임={}, 연장된 시간={}, 연장 횟수={}",
            gameNumber,
            extendedUntil,
            game.timeExtensionCount
        )

        val message = mapOf(
            "type" to "TIME_EXTENDED",
            "extendedUntil" to extendedUntil.toString(),
            "message" to "게임 시작 시간이 5분 연장되었습니다."
        )
        gameMonitoringService.broadcastEvent(gameNumber, message)
        chatService.sendSystemMessage(game, "방장이 게임 시작 시간을 연장했습니다. (+5분)")

        return TimeExtensionResponse(
            extendedUntil = extendedUntil.toString(),
            gameNumber = gameNumber
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
                    else -> GamePhase.SPEECH
                }
            }
        }
    }

    private fun findAccusedPlayer(players: List<PlayerEntity>): PlayerEntity? {
        return players.find { it.state == PlayerState.ACCUSED || it.state == PlayerState.DEFENDED }
    }

}
