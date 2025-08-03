package org.example.kotlin_liargame.domain.game.service

import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.dto.request.*
import org.example.kotlin_liargame.domain.game.dto.response.GameResultResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameRoomListResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.*
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.example.kotlin_liargame.tools.security.UserPrincipal
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GameService(
    private val gameRepository: GameRepository,
    private val playerRepository: PlayerRepository,
    private val userRepository: UserRepository,
    private val subjectRepository: SubjectRepository,
    private val wordRepository: WordRepository,
    private val chatService: ChatService,
    private val messagingTemplate: SimpMessagingTemplate
) {

    private fun validateExistingOwner() {
        val userId = getCurrentUserId()

        val activeGames = gameRepository.findAll()
            .filter { it.gState == GameState.WAITING ||
            it.gState == GameState.IN_PROGRESS }

        for (game in activeGames) {
            val playerInGame = playerRepository.findByGameAndUserId(game, userId)
            if (playerInGame != null) {
                println("[DEBUG] User already in game: gameId = ${game.gNumber}, state = ${game.gState}")
                throw RuntimeException("이미 진행중인 게임에 참여하고 있습니다.")
            }
        }

        println("[DEBUG] validateExistingOwner passed")

    }

    private fun findNextAvailableRoomNumber(): Int {
        val activeGames = gameRepository.findAllActiveGames()
        val usedNumbers = activeGames.map { it.gNumber }.toSet()


        for (number in 1..999) {
            if (!usedNumbers.contains(number)) {
                return number
            }
        }


        throw RuntimeException("모든 방 번호(1-999)가 모두 사용중입니다. 나중에 다시 시도해주세요.")
    }

    private fun getCurrentUserNickname(): String {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")

        return when (val principal = authentication.principal) {
            is UserPrincipal -> {
                println("[DEBUG] UserPrincipal found: ${principal.nickname}")
                principal.nickname
            }
            is String -> {
                println("[DEBUG] String principal found: $principal")
                if (principal == "anonymousUser") {
                    throw IllegalStateException("Anonymous user cannot create game room. Please login first.")
                }
                principal
            }
            else -> {
                println("[DEBUG] Unknown principal type: ${principal::class.java.simpleName}")
                throw IllegalStateException("Unknown principal type: ${principal::class.java.simpleName}. Expected UserPrincipal but got ${principal::class.java.simpleName}")
            }
        }
    }


    private fun getCurrentUserId(): Long {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")

        return when (val principal = authentication.principal) {
            is UserPrincipal -> {
                println("[DEBUG] UserPrincipal found with userId: ${principal.userId}")
                principal.userId
            }
            is String -> {
                println("[DEBUG] String principal found: $principal")
                if (principal == "anonymousUser") {
                    throw IllegalStateException("Anonymous user cannot create game room. Please login first.")
                }
                1L
            }
            else -> {
                println("[DEBUG] Unknown principal type: ${principal::class.java.simpleName}")
                throw IllegalStateException("Unknown principal type: ${principal::class.java.simpleName}. Expected UserPrincipal but got ${principal::class.java.simpleName}")
            }
        }
    }


    @Transactional
    fun createGameRoom(req: CreateGameRoomRequest): Int {
        req.validate()

        val nickname = getCurrentUserNickname()
        validateExistingOwner()

        val nextRoomNumber = findNextAvailableRoomNumber()
        val newGame = req.to(nextRoomNumber, nickname)

        val selectedSubjects = selectSubjectsForGameRoom(req)
        if (selectedSubjects.isNotEmpty()) {
            val citizenSubject = selectedSubjects.first()
            newGame.citizenSubject = citizenSubject

            val liarSubject = if (selectedSubjects.size > 1) selectedSubjects[1] else citizenSubject
            newGame.liarSubject = liarSubject
        }

        val savedGame = gameRepository.save(newGame)

        joinGame(savedGame, getCurrentUserId(), nickname)

        return savedGame.gNumber
    }

    private fun selectSubjectsForGameRoom(req: CreateGameRoomRequest): List<SubjectEntity> {
        val allSubjects = subjectRepository.findAll().toList()
        val validSubjects = allSubjects.filter { it.word.size >= 2 }

        if (validSubjects.isEmpty()) {
            return createTestSubjects()
        }

        val selectedSubjects = when {
            req.subjectIds != null -> {
                req.subjectIds.mapNotNull { subjectId ->
                    subjectRepository.findById(subjectId).orElse(null)
                }.filter { it.word.size >= 2 }
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
    fun joinGame(req: JoinGameRequest): GameStateResponse {
        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("게임방을 찾을 수 없습니다: ${req.gNumber}")

        if (game.gState != GameState.WAITING) {
            throw RuntimeException("게임이 이미 시작되었습니다.")
        }

        val currentPlayers = playerRepository.findByGame(game)
        if (currentPlayers.size >= game.gParticipants) {
            throw RuntimeException("게임방이 가득 찼습니다.")
        }

        val userId = getCurrentUserId()
        val nickname = getCurrentUserNickname()

        val existingPlayer = playerRepository.findByGameAndUserId(game, userId)
        if (existingPlayer != null) {
            return getGameState(game)
        }

        joinGame(game, userId, nickname)

        val newPlayerCount = currentPlayers.size + 1

        val roomUpdateMessage = mapOf(
            "type" to "PLAYER_JOINED",
            "gameNumber" to game.gNumber,
            "playerName" to nickname,
            "userId" to userId,
            "currentPlayers" to newPlayerCount,
            "maxPlayers" to game.gParticipants,
            "roomData" to mapOf(
                "gameNumber" to game.gNumber,
                "title" to game.gName,
                "host" to game.gOwner,
                "currentPlayers" to newPlayerCount,
                "maxPlayers" to game.gParticipants,
                "subject" to (game.citizenSubject?.content ?: "주제 설정 중"),
                "state" to game.gState.name,
                "players" to playerRepository.findByGame(game).map { player ->
                    mapOf(
                        "id" to player.id,
                        "userId" to player.userId,
                        "nickname" to player.nickname,
                        "isHost" to (player.nickname == game.gOwner),
                        "isAlive" to player.isAlive
                    )
                }
            )
        )

        println("[DEBUG] Broadcasting room update: $roomUpdateMessage")

        messagingTemplate.convertAndSend("/topic/room.${game.gNumber}", roomUpdateMessage)

        messagingTemplate.convertAndSend("/topic/lobby", mapOf(
            "type" to "ROOM_UPDATED",
            "gameNumber" to game.gNumber,
            "currentPlayers" to newPlayerCount,
            "maxPlayers" to game.gParticipants
        ))

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
    fun leaveGame(req: LeaveGameRequest): Boolean {
        val game = gameRepository.findByGNumber(req.gNumber)
            ?: throw GameNotFoundException("게임방을 찾을 수 없습니다: ${req.gNumber}")

        val userId = getCurrentUserId()
        val nickname = getCurrentUserNickname()

        val deletedCount = playerRepository.deleteByGameIdAndUserId(game.id, userId)

        if (deletedCount > 0) {
            val remainingPlayers = playerRepository.findByGame(game)

            val roomUpdateMessage = mapOf(
                "type" to "PLAYER_LEFT",
                "gameNumber" to game.gNumber,
                "playerName" to nickname,
                "userId" to userId,
                "currentPlayers" to remainingPlayers.size,
                "maxPlayers" to game.gParticipants,
                "roomData" to mapOf(
                    "gameNumber" to game.gNumber,
                    "title" to game.gName,
                    "host" to game.gOwner,
                    "currentPlayers" to remainingPlayers.size,
                    "maxPlayers" to game.gParticipants,
                    "subject" to (game.citizenSubject?.content ?: "주제 설정 중"),
                    "state" to game.gState.name,
                    "players" to remainingPlayers.map { player ->
                        mapOf(
                            "id" to player.id,
                            "userId" to player.userId,
                            "nickname" to player.nickname,
                            "isHost" to (player.nickname == game.gOwner),
                            "isAlive" to player.isAlive
                        )
                    }
                )
            )

            println("[DEBUG] Broadcasting player leave: $roomUpdateMessage")

            messagingTemplate.convertAndSend("/topic/room.${game.gNumber}", roomUpdateMessage)

            messagingTemplate.convertAndSend("/topic/lobby", mapOf(
                "type" to "ROOM_UPDATED",
                "gameNumber" to game.gNumber,
                "currentPlayers" to remainingPlayers.size,
                "maxPlayers" to game.gParticipants
            ))

            return true
        }

        return false
    }

    @Transactional
    fun startGame(req: StartGameRequest): GameStateResponse {
        req.validate()

        val nickname = getCurrentUserNickname()
        val game = gameRepository.findBygOwner(nickname)
            ?: throw RuntimeException("게임??찾을 ???�습?�다. 먼�? 게임방을 ?�성?�주?�요.")

        if (game.gState != GameState.WAITING) {
            throw RuntimeException("게임???��? 진행 중이거나 종료?�었?�니??")
        }

        val players = playerRepository.findByGame(game)
        if (!game.canStart(players.size)) {
            throw RuntimeException("게임???�작?�기 ?�한 ?�레?�어가 충분?��? ?�습?�다. (최소 3�? 최�? 15�?")
        }


        val selectedSubjects = if (game.citizenSubject != null) {
            val subjects = mutableListOf<SubjectEntity>()
            subjects.add(game.citizenSubject!!)

            if (game.liarSubject != null && game.liarSubject != game.citizenSubject) {
                subjects.add(game.liarSubject!!)
            }

            subjects
        } else {

            selectSubjects(req)
        }

        assignRolesAndSubjects(game, players, selectedSubjects)

        game.startGame()
        gameRepository.save(game)

        return getGameState(game)
    }

    private fun selectSubjects(req: StartGameRequest): List<SubjectEntity> {
        println("[DEBUG] selectSubjects called with request: $req")

        val allSubjects = subjectRepository.findAll().toList()
        println("[DEBUG] Found ${allSubjects.size} total subjects")
        allSubjects.forEach { subject ->
            println("[DEBUG] Available subject '${subject.content}' (ID: ${subject.id}) has ${subject.word.size} words")
            subject.word.forEach { word ->
                println("[DEBUG]   - Word: '${word.content}' (ID: ${word.id})")
            }
        }

        val validSubjects = allSubjects.filter { it.word.size >= 2 }
        if (validSubjects.isEmpty()) {
            println("[DEBUG] No subjects with at least 2 words available in database, creating test subjects")
            return createTestSubjects()
        }

        println("[DEBUG] Found ${validSubjects.size} valid subjects with at least 2 words")
        validSubjects.forEach { subject ->
            println("[DEBUG] Valid subject '${subject.content}' (ID: ${subject.id}) has ${subject.word.size} words")
        }

        val selectedSubjects = when {
            req.subjectIds != null -> {
                println("[DEBUG] Using specific subject IDs: ${req.subjectIds}")
                req.subjectIds.map { subjectId ->
                    println("[DEBUG] Looking up subject with ID: $subjectId")
                    val subject = subjectRepository.findById(subjectId).orElseThrow {
                        RuntimeException("Subject with ID $subjectId not found")
                    }
                    println("[DEBUG] Found subject '${subject.content}' (ID: ${subject.id}) with ${subject.word.size} words")

                    if (subject.word.size < 2) {
                        println("[DEBUG] Subject '${subject.content}' has insufficient words: ${subject.word.size}, but proceeding anyway")
                    }
                    subject
                }
            }

            req.useAllSubjects -> {
                println("[DEBUG] Using all valid subjects")
                validSubjects
            }

            req.useRandomSubjects -> {
                val count = req.randomSubjectCount ?: 1
                println("[DEBUG] Using $count random subjects")
                val randomCount = count.coerceAtMost(validSubjects.size)
                if (randomCount < count) {
                    println("[DEBUG] Requested ${count} random subjects, but only ${randomCount} valid subjects are available")
                }
                validSubjects.shuffled().take(randomCount)
            }

            else -> {
                println("[DEBUG] Using default selection (one random subject)")
                listOf(validSubjects.random())
            }
        }

        if (selectedSubjects.isEmpty()) {
            throw RuntimeException("No subjects were selected")
        }

        println("[DEBUG] Selected ${selectedSubjects.size} subjects")
        selectedSubjects.forEach { subject ->
            println("[DEBUG] Selected subject '${subject.content}' (ID: ${subject.id}) has ${subject.word.size} words")
            subject.word.forEach { word ->
                println("[DEBUG]   - Word: '${word.content}' (ID: ${word.id})")
            }
        }

        return selectedSubjects
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

        val liarCount = game.gLiarCount.coerceAtMost(players.size - 1)
        val liarIndices = players.indices.shuffled().take(liarCount)

        players.forEachIndexed { index, player ->
            val isLiar = index in liarIndices
            val role = if (isLiar) PlayerRole.LIAR else PlayerRole.CITIZEN

            val subject = when {
                !isLiar -> subjects.random()

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

        val citizenSubject = game.citizenSubject
        if (citizenSubject == null) {
            throw RuntimeException("Citizen subject not found")
        }

        val isCorrect = citizenSubject.word.any { word ->
            req.guess.equals(word.content, ignoreCase = true)
        }

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

    fun getGameState(req: Int): GameStateResponse {
        val game = gameRepository.findBygNumber(req)
            ?: throw RuntimeException("Game not found")

        return getGameState(game)
    }

    fun getGameResult(req: Int): GameResultResponse {
        val game = gameRepository.findBygNumber(req)
            ?: throw RuntimeException("Game not found")

        if (game.gState != GameState.ENDED) {
            throw RuntimeException("Game is not ended")
        }

        val players = playerRepository.findByGame(game)
        val liars = players.filter { it.role == PlayerRole.LIAR }

        val liarsWin = liars.any { it.isAlive }

        return GameResultResponse.from(
            game = game,
            players = players,
            winningTeam = if (liarsWin) WinningTeam.LIARS else WinningTeam.CITIZENS
        )
    }

    fun getAllGameRooms(): GameRoomListResponse {
        val activeGames = gameRepository.findAllActiveGames()

        val playerCounts = mutableMapOf<Long, Int>()
        val playersMap = mutableMapOf<Long, List<PlayerEntity>>()

        activeGames.forEach { game ->
            val players = playerRepository.findByGame(game)

            println("[DEBUG] Game ${game.gNumber} (ID: ${game.id}): found ${players.size} players")
            players.forEach { player ->
                println("[DEBUG]   - Player: ${player.nickname} (ID: ${player.id}, User: ${player.userId})")
            }

            playerCounts[game.id] = players.size
            playersMap[game.id] = players
        }

        println("[DEBUG] Player counts: $playerCounts")

        return GameRoomListResponse.from(activeGames, playerCounts, playersMap)
    }


    @Transactional
    fun endOfRound(req: EndOfRoundRequest): GameStateResponse {
        val game = gameRepository.findBygNumber(req.gNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        if (game.gOwner != req.gOwner) {
            throw RuntimeException("Only the game owner can end the round")
        }

        if (game.gCurrentRound != req.gRound) {
            throw RuntimeException("Round number mismatch")
        }

        if (req.gIsGameOver) {
            game.endGame()
            gameRepository.save(game)
        }

        chatService.startPostRoundChat(req.gNumber)

        return getGameState(game)
    }

    private fun getGameState(game: GameEntity): GameStateResponse {
        val players = playerRepository.findByGame(game)
        val currentUserId = getCurrentUserId()
        val currentPhase = determineGamePhase(game, players)
        val accusedPlayer = findAccusedPlayer(players)

        val currentPlayer = players.find { it.userId == currentUserId }
        val isChatAvailable = if (currentPlayer != null) {
            chatService.isChatAvailable(game, currentPlayer)
        } else {
            false
        }

        return GameStateResponse.from(
            game = game,
            players = players,
            currentUserId = currentUserId,
            currentPhase = currentPhase,
            accusedPlayer = accusedPlayer,
            isChatAvailable = isChatAvailable
        )
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


    private fun createTestSubjects(): List<SubjectEntity> {
        println("[DEBUG] Creating test subjects for testing")

        val animalSubject = SubjectEntity(
            content = "동물",
            word = emptyList()
        )

        val fruitSubject = SubjectEntity(
            content = "과일",
            word = emptyList()
        )

        val savedAnimalSubject = subjectRepository.save(animalSubject)
        val savedFruitSubject = subjectRepository.save(fruitSubject)

        val animalWords = listOf("호랑이", "사자", "코끼리", "기린")
        animalWords.forEach { wordContent ->
            val word = org.example.kotlin_liargame.domain.word.model.WordEntity(
                content = wordContent,
                subject = savedAnimalSubject
            )
            wordRepository.save(word)
        }

        val fruitWords = listOf("사과", "바나나", "오렌지", "포도")
        fruitWords.forEach { wordContent ->
            val word = org.example.kotlin_liargame.domain.word.model.WordEntity(
                content = wordContent,
                subject = savedFruitSubject
            )
            wordRepository.save(word)
        }

        val subjects = subjectRepository.findAll().toList()
        println("[DEBUG] Created test subjects: ${subjects.size}")
        subjects.forEach { subject ->
            println("[DEBUG] Test subject '${subject.content}' (ID: ${subject.id}) has ${subject.word.size} words")
        }

        return subjects
    }
}
