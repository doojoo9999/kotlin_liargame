package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.request.CreateGameRoomRequest
import org.example.kotlin_liargame.domain.game.dto.request.JoinGameRequest
import org.example.kotlin_liargame.domain.game.dto.request.StartGameRequest
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.tools.security.UserPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GameService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val userRepository: UserRepository,
    private val subjectRepository: SubjectRepository
) {

    private fun validateExistingOwner(ownerName: String) {
        if (gameRepository.findBygOwner(ownerName) != null) {
            throw RuntimeException("이미 방장으로 게임을 진행하고 있습니다.")
        }
    }

    private fun findNextAvailableRoomNumber(): Int {
        var roomNumber = 1
        while (gameRepository.findBygNumber(roomNumber) != null) {
            roomNumber++
        }
        return roomNumber
    }

    private fun getCurrentUserNickname(): String {
        val authentication = SecurityContextHolder.getContext().authentication
        return (authentication.principal as UserPrincipal).nickname
    }

    private fun getCurrentUserId(): Long {
        val authentication = SecurityContextHolder.getContext().authentication
        return (authentication.principal as UserPrincipal).userId
    }

    @Transactional
    fun createGameRoom(req: CreateGameRoomRequest): Int {
        req.validate()
        
        val nickname = getCurrentUserNickname()
        validateExistingOwner(nickname)

        val nextRoomNumber = findNextAvailableRoomNumber()
        val newGame = req.to(nextRoomNumber, nickname)
        val savedGame = gameRepository.save(newGame)
        
        joinGame(savedGame, getCurrentUserId(), nickname)
        
        return savedGame.gNumber
    }

    @Transactional
    fun joinGame(req: JoinGameRequest): GameStateResponse {
        req.validate()

        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gState != GameState.WAITING) {
            throw RuntimeException("Game is already in progress or ended")
        }

        if (game.gPassword != null && game.gPassword != req.gPassword) {
            throw RuntimeException("Invalid password")
        }

        val playerCount = playerRepository.countByGame(game)
        if (game.isFull(playerCount)) {
            throw RuntimeException("Game is full")
        }

        val userId = getCurrentUserId()
        val nickname = getCurrentUserNickname()

        if (playerRepository.findByGameAndUserId(game, userId) != null) {
            throw RuntimeException("You are already in this game")
        }

        joinGame(game, userId, nickname)

        return getGameState(game)
    }

    private fun joinGame(game: GameEntity, userId: Long, nickname: String) {
        val player = PlayerEntity(
            game = game,
            userId = userId,
            nickname = nickname,
            isAlive = true,
            role = PlayerRole.CITIZEN,
            subject = subjectRepository.findAll().first(),
            state = PlayerState.WAITING_FOR_HINT,
            votesReceived = 0,
            hint = null,
            defense = null,
            votedFor = null
        )

        playerRepository.save(player)
    }


    @Transactional
    fun startGame(req: StartGameRequest): GameStateResponse {
        req.validate()

        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")

        val nickname = getCurrentUserNickname()
        if (game.gOwner != nickname) {
            throw RuntimeException("Only the game owner can start the game")
        }

        if (game.gState != GameState.WAITING) {
            throw RuntimeException("Game is already in progress or ended")
        }

        val players = playerRepository.findByGame(game)
        if (!game.canStart(players.size)) {
            throw RuntimeException("Not enough players to start the game (min 3, max 15)")
        }

        val subjects = selectSubjects(req.subjectId)

        assignRolesAndSubjects(game, players, subjects.first, subjects.second)

        game.startGame()
        gameRepository.save(game)

        return getGameState(game)
    }

    private fun selectSubjects(subjectId: Long?): Pair<SubjectEntity, SubjectEntity> {
        val allSubjects = subjectRepository.findAll().toList()
        if (allSubjects.size < 2) {
            throw RuntimeException("Not enough subjects available (need at least 2)")
        }

        val citizenSubject = if (subjectId != null) {
            allSubjects.find { it.id == subjectId }
                ?: throw RuntimeException("Subject not found")
        } else {
            allSubjects.random()
        }

        var liarSubject: SubjectEntity
        do {
            liarSubject = allSubjects.random()
        } while (liarSubject.id == citizenSubject.id)

        return Pair(citizenSubject, liarSubject)
    }


    private fun getGameState(game: GameEntity): GameStateResponse {
        val players = playerRepository.findByGame(game)
        val currentUserId = getCurrentUserId()
        val currentPhase = determineGamePhase(game, players)
        val accusedPlayer = findAccusedPlayer(players)

        return GameStateResponse.from(game, players, currentUserId, currentPhase, accusedPlayer)
    }

    private fun determineGamePhase(game: GameEntity, players: List<PlayerEntity>): GamePhase {
        return when (game.gState) {
            GameState.WAITING -> GamePhase.WAITING_FOR_PLAYERS
            GameState.ENDED -> GamePhase.GAME_OVER
            GameState.IN_PROGRESS -> {
                val allPlayersGaveHints = players.all { it.state == PlayerState.GAVE_HINT || !it.isAlive }
                val allPlayersVoted = players.all { it.state == PlayerState.VOTED || !it.isAlive }
                val accusedPlayer = findAccusedPlayer(players)

                when {
                    accusedPlayer?.state == PlayerState.ACCUSED -> GamePhase.DEFENDING
                    accusedPlayer?.state == PlayerState.DEFENDED -> GamePhase.VOTING_FOR_SURVIVAL
                    allPlayersVoted -> GamePhase.VOTING_FOR_LIAR
                    allPlayersGaveHints -> GamePhase.VOTING_FOR_LIAR
                    else -> GamePhase.GIVING_HINTS
                }
            }
        }
    }

    private fun findAccusedPlayer(players: List<PlayerEntity>): PlayerEntity? {
        return players.find { it.state == PlayerState.ACCUSED || it.state == PlayerState.DEFENDED }
    }


}