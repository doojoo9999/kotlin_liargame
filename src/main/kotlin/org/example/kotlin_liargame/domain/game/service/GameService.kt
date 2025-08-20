package org.example.kotlin_liargame.domain.game.service

import jakarta.servlet.http.HttpSession
import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.dto.request.*
import org.example.kotlin_liargame.domain.game.dto.response.GameResultResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameRoomListResponse
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.GameSubjectEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.*
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.GameSubjectRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.domain.word.repository.WordRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

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
    private val defenseService: DefenseService
) {

    private fun validateExistingOwner(session: HttpSession) {
        val userId = getCurrentUserId(session)

        val activeGames = gameRepository.findAll()
            .filter { it.gameState == GameState.WAITING ||
            it.gameState == GameState.IN_PROGRESS }

        for (game in activeGames) {
            val playerInGame = playerRepository.findByGameAndUserId(game, userId)
            if (playerInGame != null) {
                println("[DEBUG] User already in game: gameId = ${game.gameNumber}, state = ${game.gameState}")
                throw RuntimeException("이미 진행중인 게임에 참여하고 있습니다.")
            }
        }

        println("[DEBUG] validateExistingOwner passed")

    }

    private fun findNextAvailableRoomNumber(): Int {
        val activeGames = gameRepository.findAllActiveGames()
        val usedNumbers = activeGames.map { it.gameNumber }.toSet()


        for (number in 1..999) {
            if (!usedNumbers.contains(number)) {
                return number
            }
        }


        throw RuntimeException("모든 방 번호(1-999)가 모두 사용중입니다. 나중에 다시 시도해주세요.")
    }

    private fun getCurrentUserId(session: HttpSession): Long {
        return session.getAttribute("userId") as? Long
            ?: throw RuntimeException("Not authenticated")
    }

    private fun getCurrentUserNickname(session: HttpSession): String {
        return session.getAttribute("nickname") as? String
            ?: throw RuntimeException("Not authenticated")
    }


    @Transactional
    fun createGameRoom(req: CreateGameRoomRequest, session: HttpSession): Int {

        val nickname = getCurrentUserNickname(session)
        validateExistingOwner(session)

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

        selectedSubjects.forEach { subject ->
            val gameSubject = GameSubjectEntity(
                game = savedGame,
                subject = subject
            )
            gameSubjectRepository.save(gameSubject)
        }

        joinGame(savedGame, getCurrentUserId(session), nickname)

        return savedGame.gameNumber
    }

    private fun selectSubjectsForGameRoom(req: CreateGameRoomRequest): List<SubjectEntity> {
        val allSubjects = subjectRepository.findAll().toList()
        val validSubjects = allSubjects.filter { it.word.size >= 5 }

        if (validSubjects.isEmpty()) {
            return createTestSubjects()
        }

        val selectedSubjects = when {
            req.subjectIds != null -> {
                req.subjectIds.mapNotNull { subjectId ->
                    subjectRepository.findById(subjectId).orElse(null)
                }.filter { it.word.size >= 5 }
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
        val game = gameRepository.findByGameNumberWithLock(req.gameNumber)
            ?: throw RuntimeException("게임방을 찾을 수 없습니다: ${req.gameNumber}")

        if (game.gameState != GameState.WAITING) {
            throw RuntimeException("게임이 이미 시작되었습니다.")
        }

        val currentPlayers = playerRepository.findByGame(game)
        if (currentPlayers.size >= game.gameParticipants) {
            throw RuntimeException("게임방이 가득 찼습니다.")
        }

        val userId = getCurrentUserId(session)
        val nickname = getCurrentUserNickname(session)

        val existingPlayer = playerRepository.findByGameAndUserId(game, userId)
        if (existingPlayer != null) {
            return getGameState(game, session)
        }

        val newPlayer = joinGame(game, userId, nickname)

        val allPlayers = playerRepository.findByGame(game)
        gameMonitoringService.notifyPlayerJoined(game, newPlayer, allPlayers)

        return getGameState(game, session)
    }


    private fun joinGame(game: GameEntity, userId: Long, nickname: String): PlayerEntity {
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
        return playerRepository.save(player)
    }

    @Transactional
    fun leaveGame(req: LeaveGameRequest, session: HttpSession): Boolean {
                    val game = gameRepository.findByGameNumberWithLock(req.gameNumber)
            ?: throw RuntimeException("게임방을 찾을 수 없습니다: ${req.gameNumber}")

        val userId = getCurrentUserId(session)
        val nickname = getCurrentUserNickname(session)

        val deletedCount = playerRepository.deleteByGameIdAndUserId(game.id, userId)

        if (deletedCount > 0) {
            val remainingPlayers = playerRepository.findByGame(game)

            // Check if the leaving player was the room owner
            val wasOwner = game.gameOwner == nickname

            if (remainingPlayers.isEmpty()) {
                // No players left, delete the room
                println("[DEBUG] No players remaining, deleting room ${game.gameNumber}")
                gameRepository.delete(game)
                gameMonitoringService.notifyRoomDeleted(game.gameNumber)
                return true
            } else if (wasOwner) {
                // Transfer ownership to the oldest remaining player (earliest joinedAt timestamp)
                val newOwner = remainingPlayers.minByOrNull { it.joinedAt }
                if (newOwner != null) {
                    game.gameOwner = newOwner.nickname
                    gameRepository.save(game)
                    println("[DEBUG] Transferred ownership from $nickname to ${newOwner.nickname} in room ${game.gameNumber} (joined at: ${newOwner.joinedAt})")
                }
            }

            gameMonitoringService.notifyPlayerLeft(game, nickname, userId, remainingPlayers)

            return true
        }

        return false
    }

    @Transactional
    fun defend(req: DefendRequest, session: HttpSession): GameStateResponse {

                    val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gameState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val userId = getCurrentUserId(session)
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

        return getGameState(game, session)
    }

    @Transactional
    fun guessWord(req: GuessWordRequest, session: HttpSession): GameResultResponse {

                    val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gameState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
        }

        val userId = getCurrentUserId(session)
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

    fun getGameState(req: Int, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumber(req)
            ?: throw RuntimeException("Game not found")

        return getGameState(game, session)
    }

    fun getGameResult(req: Int, session: HttpSession): GameResultResponse {
        val game = gameRepository.findByGameNumber(req)
            ?: throw RuntimeException("Game not found")

        if (game.gameState != GameState.ENDED) {
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

    fun getAllGameRooms(session: HttpSession): GameRoomListResponse {
        val activeGames = gameRepository.findAllActiveGames()

        val playerCounts = mutableMapOf<Long, Int>()
        val playersMap = mutableMapOf<Long, List<PlayerEntity>>()
        val gameSubjectsMap = mutableMapOf<Long, List<String>>()

        activeGames.forEach { game ->
            val players = playerRepository.findByGame(game)
            val gameSubjects = gameSubjectRepository.findByGameWithSubject(game)
            val subjectNames = gameSubjects.map { it.subject.content ?: "Unknown" }

            println("[DEBUG] Game ${game.gameNumber} (ID: ${game.id}): found ${players.size} players")
            players.forEach { player ->
                println("[DEBUG]   - Player: ${player.nickname} (ID: ${player.id}, User: ${player.userId})")
            }
            println("[DEBUG] Game ${game.gameNumber} subjects: $subjectNames")

            playerCounts[game.id] = players.size
            playersMap[game.id] = players
            gameSubjectsMap[game.id] = subjectNames
        }

        println("[DEBUG] Player counts: $playerCounts")

        return GameRoomListResponse.from(activeGames, playerCounts, playersMap, gameSubjectsMap)
    }


    @Transactional
    fun endOfRound(req: EndOfRoundRequest, session: HttpSession): GameStateResponse {
        val game = gameRepository.findByGameNumber(req.gameNumber)
            ?: throw RuntimeException("Game not found")

        if (game.gameState != GameState.IN_PROGRESS) {
            throw RuntimeException("Game is not in progress")
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
    fun recoverGameState(gameNumber: Int, userId: Long): Map<String, Any> {
        val game = gameRepository.findByGameNumber(gameNumber)
            ?: throw IllegalArgumentException("Game not found: $gameNumber")

        val player = playerRepository.findByGameAndUserId(game, userId)
            ?: throw IllegalArgumentException("Player not found in game")

        val defenseRecovery = defenseService.recoverGameState(gameNumber)

        return mapOf(
            "gameNumber" to gameNumber,
            "gameState" to game.gameState.name,
            "defense" to defenseRecovery,
            "player" to mapOf(
                "id" to player.id,
                "nickname" to player.nickname,
                "isAlive" to player.isAlive,
                "role" to player.role.name
            ),
            "timestamp" to java.time.Instant.now().toString()
        )
    }


    private fun getGameState(game: GameEntity, session: HttpSession): GameStateResponse {
        val players = playerRepository.findByGame(game)
        val currentUserId = getCurrentUserId(session)
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
        return when (game.gameState) {
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

        val foodSubject = SubjectEntity(
            content = "음식",
            word = emptyList()
        )

        val jobSubject = SubjectEntity(
            content = "직업",
            word = emptyList()
        )

        val savedAnimalSubject = subjectRepository.save(animalSubject)
        val savedFruitSubject = subjectRepository.save(fruitSubject)
        val savedFoodSubject = subjectRepository.save(foodSubject)
        val savedJobSubject = subjectRepository.save(jobSubject)

        val animalWords = listOf("호랑이", "사자", "코끼리", "기린", "원숭이", "곰", "늑대")
        animalWords.forEach { wordContent ->
            val word = org.example.kotlin_liargame.domain.word.model.WordEntity(
                content = wordContent,
                subject = savedAnimalSubject
            )
            wordRepository.save(word)
        }

        val fruitWords = listOf("사과", "바나나", "오렌지", "포도", "딸기", "수박", "복숭아")
        fruitWords.forEach { wordContent ->
            val word = org.example.kotlin_liargame.domain.word.model.WordEntity(
                content = wordContent,
                subject = savedFruitSubject
            )
            wordRepository.save(word)
        }

        val foodWords = listOf("김치", "불고기", "비빔밥", "냉면", "떡볶이", "치킨", "피자")
        foodWords.forEach { wordContent ->
            val word = org.example.kotlin_liargame.domain.word.model.WordEntity(
                content = wordContent,
                subject = savedFoodSubject
            )
            wordRepository.save(word)
        }

        val jobWords = listOf("의사", "교사", "개발자", "간호사", "요리사", "경찰관", "소방관")
        jobWords.forEach { wordContent ->
            val word = org.example.kotlin_liargame.domain.word.model.WordEntity(
                content = wordContent,
                subject = savedJobSubject
            )
            wordRepository.save(word)
        }

        // Flush to ensure all words are saved to database
        wordRepository.flush()
        subjectRepository.flush()

        val subjects = subjectRepository.findAll().toList()
        println("[DEBUG] Created test subjects: ${subjects.size}")
        subjects.forEach { subject ->
            println("[DEBUG] Test subject '${subject.content}' (ID: ${subject.id}) has ${subject.word.size} words")
        }

        return subjects
    }
}
