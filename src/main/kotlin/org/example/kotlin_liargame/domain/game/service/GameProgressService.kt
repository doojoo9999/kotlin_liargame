package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.request.GiveHintRequest
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.global.config.GameProperties
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class GameProgressService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val subjectRepository: SubjectRepository,
    private val gameMonitoringService: GameMonitoringService,
    private val gameProperties: GameProperties
) {

    @Transactional
    fun startGame(session: HttpSession): GameStateResponse {
        val nickname = getCurrentUserNickname(session)
        val game = gameRepository.findByGameOwner(nickname)
            ?: throw RuntimeException("게임을 찾을 수 없습니다. 먼저 게임방을 생성해주세요.")

        if (game.gameState != GameState.WAITING) {
            throw RuntimeException("게임이 이미 진행 중이거나 종료되었습니다.")
        }

        val players = playerRepository.findByGame(game)
        if (players.size < gameProperties.minPlayers || players.size > gameProperties.maxPlayers) {
            throw RuntimeException("게임을 시작하기 위한 플레이어가 충분하지 않습니다. (최소 ${gameProperties.minPlayers}명, 최대 ${gameProperties.maxPlayers}명)")
        }

        val selectedSubjects = selectSubjects(game)
        assignRolesAndSubjects(game, players, selectedSubjects)

        game.startGame()
        val savedGame = gameRepository.save(game)

        startNewTurn(savedGame)

        val gameStateResponse = getGameState(savedGame, session)
        gameMonitoringService.broadcastGameState(savedGame, gameStateResponse)

        return gameStateResponse
    }

    fun startNewTurn(game: GameEntity) {
        val alivePlayers = playerRepository.findByGameAndIsAlive(game, true)
        if (alivePlayers.isEmpty()) {
            // Handle game end logic
            return
        }

        val nextPlayer = alivePlayers.first()

        game.currentPlayerId = nextPlayer.id
        game.turnStartedAt = Instant.now()
        gameRepository.save(game)

        gameMonitoringService.notifyTurnChanged(game.gameNumber, nextPlayer.id, game.turnStartedAt!!)
    }

    @Transactional
    fun forceNextTurn(gameId: Long) {
        val game = gameRepository.findById(gameId).orElse(null) ?: return
        
        game.currentPlayerId?.let {
            val currentPlayer = playerRepository.findById(it).orElse(null)
            if (currentPlayer != null && currentPlayer.state == PlayerState.WAITING_FOR_HINT) {
                currentPlayer.state = PlayerState.GAVE_HINT // Mark as spoken (timeout)
                playerRepository.save(currentPlayer)
            }
        }
        
        startNewTurn(game)
    }

    private fun selectSubjects(game: GameEntity): List<SubjectEntity> {
        if (game.citizenSubject != null) {
            val subjects = mutableListOf(game.citizenSubject!!)
            if (game.liarSubject != null && game.liarSubject != game.citizenSubject) {
                subjects.add(game.liarSubject!!)
            }
            return subjects
        }
        return subjectRepository.findAll().shuffled().take(2)
    }

    private fun assignRolesAndSubjects(
        game: GameEntity,
        players: List<PlayerEntity>,
        subjects: List<SubjectEntity>
    ) {
        if (subjects.isEmpty()) {
            throw RuntimeException("No subjects available for assignment")
        }

        val citizenSubject = subjects.first()
        game.citizenSubject = citizenSubject
        val liarSubject = if (subjects.size > 1) subjects[1] else citizenSubject
        game.liarSubject = liarSubject

        val liarCount = game.gameLiarCount.coerceAtMost(players.size - 1)
        val liarIndices = players.indices.shuffled().take(liarCount).toSet()

        players.forEachIndexed { index, player ->
            player.role = if (liarIndices.contains(index)) PlayerRole.LIAR else PlayerRole.CITIZEN
            player.subject = when {
                player.role == PlayerRole.CITIZEN -> citizenSubject
                game.gameMode == GameMode.LIARS_DIFFERENT_WORD -> liarSubject
                else -> citizenSubject
            }
            player.state = PlayerState.WAITING_FOR_HINT
        }
        playerRepository.saveAll(players)
    }

    @Transactional
    fun giveHint(req: GiveHintRequest, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")

        val userId = getCurrentUserId(session)
        
        markPlayerAsSpoken(req.gameNumber, userId)
        gameMonitoringService.notifyHintSubmitted(req.gameNumber, userId, req.hint)
        
        val players = playerRepository.findByGame(game)
        val allPlayersGaveHints = players.all { it.state == PlayerState.GAVE_HINT || !it.isAlive }

        if (allPlayersGaveHints) {
            startNewTurn(game)
        }

        return getGameState(game, session)
    }

    @Transactional
    fun markPlayerAsSpoken(gameNumber: Int, userId: Long): PlayerEntity {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gameState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")

        if (!player.isAlive) {
            throw RuntimeException("You are eliminated from the game")
        }

        if (player.state != PlayerState.WAITING_FOR_HINT) {
            throw RuntimeException("You have already spoken or are not in the hint phase")
        }

        player.state = PlayerState.GAVE_HINT
        return playerRepository.save(player)
    }

    private fun getCurrentUserId(session: HttpSession): Long {
        return session.getAttribute("userId") as? Long
            ?: throw RuntimeException("Not authenticated")
    }

    private fun getCurrentUserNickname(session: HttpSession): String {
        return session.getAttribute("nickname") as? String
            ?: throw RuntimeException("Not authenticated")
    }
    
    private fun getGameState(game: GameEntity, session: HttpSession?): GameStateResponse {
        val players = playerRepository.findByGame(game)
        val currentUserId = session?.let { getCurrentUserId(it) }
        return GameStateResponse.from(game, players, currentUserId, org.example.kotlin_liargame.domain.game.model.enum.GamePhase.GIVING_HINTS)
    }
}
