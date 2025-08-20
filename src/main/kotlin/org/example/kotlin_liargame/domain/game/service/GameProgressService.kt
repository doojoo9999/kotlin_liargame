package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.game.dto.request.GiveHintRequest
import org.example.kotlin_liargame.domain.game.dto.request.StartGameRequest
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
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GameProgressService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val subjectRepository: SubjectRepository,
    private val gameMonitoringService: GameMonitoringService
) {

    @Transactional
    fun startGame(req: StartGameRequest, session: HttpSession): GameStateResponse {
        val nickname = getCurrentUserNickname(session)
        val game = gameRepository.findByGameOwner(nickname)
            ?: throw RuntimeException("게임을 찾을 수 없습니다. 먼저 게임방을 생성해주세요.")

        if (game.gameState != GameState.WAITING) {
            throw RuntimeException("게임이 이미 진행 중이거나 종료되었습니다.")
        }

        val players = playerRepository.findByGame(game)
        if (!game.canStart(players.size)) {
            throw RuntimeException("게임을 시작하기 위한 플레이어가 충분하지 않습니다. (최소 3명, 최대 15명)")
        }

        val selectedSubjects = selectSubjects(req, game)
        assignRolesAndSubjects(game, players, selectedSubjects)

        game.startGame()
        val savedGame = gameRepository.save(game)

        val gameStateResponse = getGameState(savedGame, session)
        gameMonitoringService.broadcastGameState(savedGame, gameStateResponse)

        return gameStateResponse
    }

    private fun selectSubjects(req: StartGameRequest, game: GameEntity): List<SubjectEntity> {
        if (game.citizenSubject != null) {
            val subjects = mutableListOf(game.citizenSubject!!)
            if (game.liarSubject != null && game.liarSubject != game.citizenSubject) {
                subjects.add(game.liarSubject!!)
            }
            return subjects
        }
        // Simplified subject selection logic for brevity.
        // In a real scenario, you would implement the full logic from GameService.
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
        val liarIndices = players.indices.shuffled().take(liarCount)

        players.forEachIndexed { index, player ->
            player.role = if (index in liarIndices) PlayerRole.LIAR else PlayerRole.CITIZEN
            player.subject = when {
                player.role == PlayerRole.CITIZEN -> subjects.random()
                game.gameMode == GameMode.LIARS_DIFFERENT_WORD -> liarSubject
                else -> citizenSubject
            }
            player.state = PlayerState.WAITING_FOR_HINT
            playerRepository.save(player)
        }
    }

    @Transactional
    fun giveHint(req: GiveHintRequest, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")

        val userId = getCurrentUserId(session)
        
        markPlayerAsSpoken(req.gameNumber, userId)

        val gameStateResponse = getGameState(game, session)
        gameMonitoringService.broadcastGameState(game, gameStateResponse)
        return gameStateResponse
    }

    @Transactional
    fun markPlayerAsSpoken(gameNumber: Int, userId: Long) {
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
        playerRepository.save(player)

        val players = playerRepository.findByGame(game)
        val allPlayersGaveHints = players.all { it.state == PlayerState.GAVE_HINT || !it.isAlive }

        if (allPlayersGaveHints) {
            players.forEach { p ->
                if (p.isAlive) {
                    p.setWaitingForVote()
                    playerRepository.save(p)
                }
            }
        }
    }

    private fun getCurrentUserId(session: HttpSession): Long {
        return session.getAttribute("userId") as? Long
            ?: throw RuntimeException("Not authenticated")
    }

    private fun getCurrentUserNickname(session: HttpSession): String {
        return session.getAttribute("nickname") as? String
            ?: throw RuntimeException("Not authenticated")
    }
    
    // This is a simplified version of getGameState. You might need to move the full implementation
    // or create a shared component/service for it.
    private fun getGameState(game: GameEntity, session: HttpSession): GameStateResponse {
        val players = playerRepository.findByGame(game)
        val currentUserId = getCurrentUserId(session)
        // GamePhase logic would be needed here.
        return GameStateResponse.from(game, players, currentUserId, org.example.kotlin_liargame.domain.game.model.enum.GamePhase.GIVING_HINTS)
    }
}