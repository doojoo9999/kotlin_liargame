package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.game.dto.request.*
import org.example.kotlin_liargame.domain.game.dto.response.GameResultResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.*
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


    private fun assignRolesAndSubjects(
        game: GameEntity,
        players: List<PlayerEntity>,
        citizenSubject: SubjectEntity,
        liarSubject: SubjectEntity
    ) {
        game.citizenSubject = citizenSubject
        game.liarSubject = liarSubject

        val liarCount = game.gLiarCount.coerceAtMost(players.size - 1)
        val liarIndices = players.indices.shuffled().take(liarCount)

        players.forEachIndexed { index, player ->
            val isLiar = index in liarIndices
            val role = if (isLiar) PlayerRole.LIAR else PlayerRole.CITIZEN
            val subject = when {
                !isLiar -> citizenSubject
                game.gGameMode == GameMode.LIARS_DIFFERENT_WORD -> liarSubject
                else -> citizenSubject
            }

            val updatedPlayer = PlayerEntity(
                game = player.game,
                userId = player.userId,
                nickname = player.nickname,
                isAlive = true,
                role = role,
                subject = subject,
                state = PlayerState.WAITING_FOR_HINT,
                votesReceived = 0,
                hint = null,
                defense = null,
                votedFor = null
            )

            playerRepository.save(updatedPlayer)
        }
    }

    @Transactional
    fun giveHint(req: GiveHintRequest): GameStateResponse {
        req.validate()

        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val userId = getCurrentUserId()
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")

        if (!player.isAlive) {
            throw RuntimeException("You are eliminated from the game")
        }

        if (player.state != PlayerState.WAITING_FOR_HINT) {
            throw RuntimeException("You have already given a hint")
        }

        player.giveHint(req.hint)
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

        return getGameState(game)
    }

    @Transactional
    fun vote(req: VoteRequest): GameStateResponse {
        req.validate()

        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val userId = getCurrentUserId()
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")

        if (!player.isAlive) {
            throw RuntimeException("You are eliminated from the game")
        }

        if (player.state != PlayerState.WAITING_FOR_VOTE) {
            throw RuntimeException("You are not in the voting phase")
        }

        val targetPlayer = playerRepository.findById(req.targetPlayerId).orElse(null)
            ?: throw RuntimeException("Target player not found")

        if (targetPlayer.game.id != game.id) {
            throw RuntimeException("Target player is not in this game")
        }

        if (!targetPlayer.isAlive) {
            throw RuntimeException("Target player is eliminated from the game")
        }

        player.voteFor(targetPlayer.id)
        playerRepository.save(player)

        targetPlayer.receiveVote()
        playerRepository.save(targetPlayer)

        val players = playerRepository.findByGame(game)
        val allPlayersVoted = players.all {
            it.state == PlayerState.VOTED || !it.isAlive ||
                    (it.state == PlayerState.WAITING_FOR_VOTE && it.hasVotingTimeExpired())
        }

        if (allPlayersVoted) {
            players.forEach { p ->
                if (p.isAlive && p.state == PlayerState.WAITING_FOR_VOTE && p.hasVotingTimeExpired()) {
                    p.state = PlayerState.VOTED
                    playerRepository.save(p)
                }
            }

            val validVoters = players.filter { it.isAlive && it.votedFor != null }

            if (validVoters.isNotEmpty()) {
                val mostVotedPlayer = players.filter { it.isAlive }
                    .maxByOrNull { it.votesReceived }

                val tiedPlayers = players.filter { it.isAlive && it.votesReceived == mostVotedPlayer?.votesReceived }
                if (tiedPlayers.size == 1 && mostVotedPlayer!!.votesReceived > 0 &&
                    mostVotedPlayer.votesReceived > validVoters.size / 2) {
                    mostVotedPlayer.accuse()
                    playerRepository.save(mostVotedPlayer)
                } else {
                    players.forEach { p ->
                        p.resetVotes()
                        playerRepository.save(p)
                    }

                    if (!game.nextRound()) {
                        game.endGame()
                        gameRepository.save(game)
                    } else {
                        players.forEach { p ->
                            if (p.isAlive) {
                                p.resetForNewRound()
                                playerRepository.save(p)
                            }
                        }
                    }
                }
            } else {
                players.forEach { p ->
                    p.resetVotes()
                    playerRepository.save(p)
                }

                if (!game.nextRound()) {
                    game.endGame()
                    gameRepository.save(game)
                } else {
                    players.forEach { p ->
                        if (p.isAlive) {
                            p.resetForNewRound()
                            playerRepository.save(p)
                        }
                    }
                }
            }
        }

        return getGameState(game)
    }

    @Transactional
    fun defend(req: DefendRequest): GameStateResponse {
        req.validate()

        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val userId = getCurrentUserId()
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")

        if (!player.isAlive) {
            throw RuntimeException("You are eliminated from the game")
        }

        if (player.state != PlayerState.ACCUSED) {
            throw RuntimeException("You are not accused")
        }

        player.defend(req.defense)
        playerRepository.save(player)

        val players = playerRepository.findByGame(game)
        players.forEach { p ->
            if (p.isAlive && p.id != player.id) {
                p.setWaitingForVote()
                p.votedFor = null
                playerRepository.save(p)
            }
        }

        return getGameState(game)
    }


    @Transactional
    fun survivalVote(req: SurvivalVoteRequest): GameStateResponse {
        req.validate()

        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val userId = getCurrentUserId()
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")

        if (!player.isAlive) {
            throw RuntimeException("You are eliminated from the game")
        }

        if (player.state != PlayerState.WAITING_FOR_VOTE) {
            throw RuntimeException("You are not in the voting phase")
        }

        val accusedPlayer = playerRepository.findById(req.accusedPlayerId).orElse(null)
            ?: throw RuntimeException("Accused player not found")

        if (accusedPlayer.game.id != game.id) {
            throw RuntimeException("Accused player is not in this game")
        }

        if (accusedPlayer.state != PlayerState.DEFENDED) {
            throw RuntimeException("Accused player has not defended yet")
        }

        player.voteFor(if (req.voteToSurvive) -1 else -2)
        playerRepository.save(player)

        val players = playerRepository.findByGame(game)
        val allPlayersVoted = players.all {
            it.state == PlayerState.VOTED || !it.isAlive || it.id == accusedPlayer.id ||
                    (it.state == PlayerState.WAITING_FOR_VOTE && it.hasVotingTimeExpired())
        }

        if (allPlayersVoted) {
            players.forEach { p ->
                if (p.isAlive && p.state == PlayerState.WAITING_FOR_VOTE && p.hasVotingTimeExpired()) {
                    p.state = PlayerState.VOTED
                    playerRepository.save(p)
                }
            }

            val validVoters = players.filter { it.isAlive && it.votedFor != null && it.id != accusedPlayer.id }
            val totalValidVotes = validVoters.size

            if (totalValidVotes > 0) {
                val surviveVotes = players.count { it.votedFor == -1L }
                val eliminateVotes = players.count { it.votedFor == -2L }

                if (surviveVotes >= eliminateVotes) {
                    accusedPlayer.survive()
                    playerRepository.save(accusedPlayer)

                    players.forEach { p ->
                        if (p.isAlive) {
                            p.resetForNewRound()
                            playerRepository.save(p)
                        }
                    }

                    if (!game.nextRound()) {
                        game.endGame()
                        gameRepository.save(game)
                    }
                } else {
                    accusedPlayer.eliminate()
                    playerRepository.save(accusedPlayer)

                    if (accusedPlayer.role == PlayerRole.LIAR) {
                    } else {
                        val remainingCitizens = players.count { it.isAlive && it.role == PlayerRole.CITIZEN }
                        if (remainingCitizens == 0) {
                            game.endGame()
                            gameRepository.save(game)
                        } else {
                            players.forEach { p ->
                                if (p.isAlive) {
                                    p.resetForNewRound()
                                    playerRepository.save(p)
                                }
                            }

                            if (!game.nextRound()) {
                                game.endGame()
                                gameRepository.save(game)
                            }
                        }
                    }
                }
            } else {
                accusedPlayer.survive()
                playerRepository.save(accusedPlayer)

                players.forEach { p ->
                    if (p.isAlive) {
                        p.resetForNewRound()
                        playerRepository.save(p)
                    }
                }

                if (!game.nextRound()) {
                    game.endGame()
                    gameRepository.save(game)
                }
            }
        }

        return getGameState(game)
    }


    @Transactional
    fun guessWord(req: GuessWordRequest): GameResultResponse {
        req.validate()

        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val userId = getCurrentUserId()
        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw RuntimeException("You are not in this game")

        if (player.role != PlayerRole.LIAR || player.isAlive) {
            throw RuntimeException("Only eliminated liars can guess the word")
        }

        val citizenWord = game.citizenSubject?.content ?: ""
        val isCorrect = req.guess.equals(citizenWord, ignoreCase = true)

        game.endGame()
        gameRepository.save(game)

        val players = playerRepository.findByGame(game)
        return GameResultResponse.from(
            game = game,
            players = players,
            winningTeam = if (isCorrect) WinningTeam.LIARS else WinningTeam.CITIZENS,
            correctGuess = isCorrect
        )
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