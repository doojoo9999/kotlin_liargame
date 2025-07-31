//package org.example.kotlin_liargame
//
//import org.example.kotlin_liargame.domain.chat.dto.request.SendChatMessageRequest
//import org.example.kotlin_liargame.domain.chat.model.ChatMessageEntity
//import org.example.kotlin_liargame.domain.chat.model.ChatMessageType
//import org.example.kotlin_liargame.domain.chat.repository.ChatMessageRepository
//import org.example.kotlin_liargame.domain.chat.service.ChatService
//import org.example.kotlin_liargame.domain.game.dto.request.*
//import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
//import org.example.kotlin_liargame.domain.game.model.enum.GameMode
//import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
//import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
//import org.example.kotlin_liargame.domain.game.service.GameService
//import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
//import org.example.kotlin_liargame.domain.subject.service.SubjectService
//import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
//import org.example.kotlin_liargame.domain.user.service.UserService
//import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
//import org.example.kotlin_liargame.domain.word.service.WordService
//import org.junit.jupiter.api.BeforeEach
//import org.junit.jupiter.api.Test
//import org.springframework.beans.factory.annotation.Autowired
//import org.springframework.boot.test.context.SpringBootTest
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
//import org.springframework.security.core.context.SecurityContextHolder
//import org.springframework.transaction.annotation.Transactional
//import kotlin.random.Random
//
//
//@SpringBootTest
//@Transactional
//class ChatInGameSimulationTest {
//
//    @Autowired
//    private lateinit var userService: UserService
//
//    @Autowired
//    private lateinit var subjectService: SubjectService
//
//    @Autowired
//    private lateinit var wordService: WordService
//
//    @Autowired
//    private lateinit var gameService: GameService
//
//    @Autowired
//    private lateinit var chatService: ChatService
//
//    @Autowired
//    private lateinit var chatMessageRepository: ChatMessageRepository
//
//    @Autowired
//    private lateinit var userRepository: org.example.kotlin_liargame.domain.user.repository.UserRepository
//
//    @Autowired
//    private lateinit var gameRepository: org.example.kotlin_liargame.domain.game.repository.GameRepository
//
//    private val users = mutableListOf<UserInfo>()
//    private var gameNumber: Int = 0
//    private var subjectContent = "동물_${System.currentTimeMillis()}"
//    private val words = listOf("사자", "호랑이", "코끼리", "기린", "팬더", "원숭이", "고양이", "하마", "뱀", "코알라")
//
//    data class UserInfo(
//        val nickname: String,
//        val profileImgUrl: String,
//        var userId: Long? = null,
//        var role: PlayerRole? = null,
//        var playerId: Long? = null
//    )
//
//    @BeforeEach
//    fun setup() {
//
//        for (i in 1..10) {
//            val nickname = "Player${i}_${Random.nextInt(1000, 9999)}"
//            val profileImgUrl = "https://example.com/profile.png"
//            users.add(UserInfo(nickname, profileImgUrl))
//
//            try {
//                userService.createUser(UserAddRequest(nickname, profileImgUrl))
//                val userEntity = userRepository.findByNickname(nickname)
//                if (userEntity != null) {
//                    users.last().userId = userEntity.id
//                    println("[DEBUG_LOG] Created user: $nickname with ID: ${userEntity.id}")
//                } else {
//                    println("[DEBUG_LOG] Created user: $nickname but couldn't find user ID")
//                }
//            } catch (e: Exception) {
//                println("[DEBUG_LOG] Failed to create user $nickname: ${e.message}")
//            }
//        }
//
//
//        val existingSubjects = subjectService.findAll().filter { it.content == subjectContent }
//        if (existingSubjects.isEmpty()) {
//            try {
//                subjectService.applySubject(SubjectRequest(subjectContent))
//                println("[DEBUG_LOG] Created subject: $subjectContent")
//            } catch (e: Exception) {
//                println("[DEBUG_LOG] Failed to create subject $subjectContent: ${e.message}")
//            }
//        } else {
//            println("[DEBUG_LOG] Subject '$subjectContent' already exists, using it")
//        }
//
//
//        words.forEach { word ->
//            try {
//                wordService.applyWord(ApplyWordRequest(subjectContent, word))
//                println("[DEBUG_LOG] Added word: $word to subject: $subjectContent")
//            } catch (e: Exception) {
//                println("[DEBUG_LOG] Failed to add word $word to subject $subjectContent: ${e.message}")
//            }
//        }
//
//
//        val subjectWords = wordService.findAll().filter { it.subjectContent == subjectContent }
//        println("[DEBUG_LOG] Subject '$subjectContent' has ${subjectWords.size} words")
//        if (subjectWords.size < 2) {
//            throw RuntimeException("Subject '$subjectContent' must have at least 2 words for the test to run")
//        }
//    }
//
//    @Test
//    fun `simulate liar game with chat`() {
//        println("[TEST] Starting Liar Game Simulation with Chat")
//
//
//        val firstUser = users[0]
//        setCurrentUser(firstUser.nickname)
//
//        val createGameRequest = CreateGameRoomRequest(
//            nickname = firstUser.nickname,
//            gName = "Chat Test Game",
//            gPassword = null,
//            gParticipants = 10,
//            gTotalRounds = 3,
//            gLiarCount = 2,
//            gGameMode = GameMode.LIARS_KNOW
//        )
//
//        gameNumber = gameService.createGameRoom(createGameRequest)
//        println("[DEBUG_LOG] Created game room: $gameNumber")
//
//
//        sendChatMessage(firstUser, "Welcome to the game everyone!", ChatMessageType.POST_ROUND)
//        println("[DEBUG_LOG] Room creator sent welcome message")
//
//
//        users.forEachIndexed { index, user ->
//            if (index > 0) {
//                setCurrentUser(user.nickname)
//                val joinGameRequest = JoinGameRequest(gameNumber)
//                val gameState = gameService.joinGame(joinGameRequest)
//                println("[DEBUG_LOG] User ${user.nickname} joined the game")
//
//
//                sendChatMessage(user, "Hello everyone! Ready to play?", ChatMessageType.POST_ROUND)
//                println("[DEBUG_LOG] User ${user.nickname} sent join message")
//            }
//        }
//
//
//        printChatMessages(ChatMessageType.POST_ROUND, "Pre-game ")
//
//
//        setCurrentUser(firstUser.nickname)
//
//
//        val allSubjects = subjectService.findAll()
//        val ourSubject = allSubjects.find { it.content == subjectContent }
//            ?: throw RuntimeException("Subject '$subjectContent' not found")
//
//
//        val otherSubject = allSubjects.filter { it.content != subjectContent }
//            .firstOrNull { subject ->
//                val subjectWords = wordService.findAll().filter { it.subjectContent == subject.content }
//                subjectWords.size >= 2
//            }
//
//        val startGameRequest = if (otherSubject != null) {
//            StartGameRequest(
//                subjectIds = listOf(ourSubject.id, otherSubject.id)
//            )
//        } else {
//            StartGameRequest(
//                subjectIds = listOf(ourSubject.id)
//            )
//        }
//
//        var gameState: GameStateResponse
//        try {
//            gameState = gameService.startGame(startGameRequest)
//            println("[DEBUG_LOG] Game started")
//        } catch (e: Exception) {
//            println("[DEBUG_LOG] Failed to start game: ${e.message}")
//            e.printStackTrace()
//            throw e
//        }
//
//
//        gameState.players.forEach { player ->
//            val user = users.find { it.nickname == player.nickname }
//            user?.playerId = player.id
//            println("[DEBUG_LOG] Player ${player.nickname} has ID ${player.id}")
//        }
//
//
//        val principal = SecurityContextHolder.getContext().authentication.principal as org.example.kotlin_liargame.tools.security.UserPrincipal
//        val currentUser = users.find { it.nickname == principal.nickname }
//        val yourRole = gameState.yourRole
//        if (currentUser != null && yourRole != null) {
//            currentUser.role = PlayerRole.valueOf(yourRole)
//            println("[DEBUG_LOG] Current user ${currentUser.nickname} has role $yourRole")
//        }
//
//
//        for (round in 1..gameState.gTotalRounds) {
//            println("[DEBUG_LOG] Starting round $round")
//            playRound(gameState)
//
//            val currentGameState = gameService.getGameState(gameNumber)
//            if (currentGameState.gState.name == "ENDED") {
//                println("[DEBUG_LOG] Game ended after round $round")
//                val gameResult = gameService.getGameResult(gameNumber)
//                println("[DEBUG_LOG] Game result: ${gameResult.winningTeam}")
//
//
//                users.forEach { user ->
//                    setCurrentUser(user.nickname)
//                    val endGameMessage = when (user.role) {
//                        PlayerRole.CITIZEN -> "Good game everyone! We citizens won!"
//                        PlayerRole.LIAR -> "You got me! Well played citizens."
//                        else -> "Good game!"
//                    }
//                    sendChatMessage(user, endGameMessage, ChatMessageType.POST_ROUND)
//                }
//
//                break
//            }
//        }
//
//
//        printChatStatistics()
//    }
//
//    private fun playRound(initialGameState: GameStateResponse) {
//
//        users.forEach { user ->
//            if (user.playerId != null) {
//                setCurrentUser(user.nickname)
//                val hint = generateHint(user)
//                val giveHintRequest = GiveHintRequest(gameNumber, hint)
//                try {
//                    gameService.giveHint(giveHintRequest)
//                    println("[DEBUG_LOG] Player ${user.nickname} gave hint: $hint")
//
//
//                    sendChatMessage(user, hint, ChatMessageType.HINT)
//                    println("[DEBUG_LOG] Player ${user.nickname} sent hint chat message")
//                } catch (e: Exception) {
//                    println("[DEBUG_LOG] Failed to give hint for ${user.nickname}: ${e.message}")
//                }
//            }
//        }
//
//
//        printChatMessages(ChatMessageType.HINT, "Hint ")
//
//
//        users.forEach { user ->
//            if (user.playerId != null) {
//                setCurrentUser(user.nickname)
//                val targetPlayer = selectPlayerToVoteFor(user)
//                if (targetPlayer != null) {
//                    val voteRequest = VoteRequest(gameNumber, targetPlayer.playerId!!)
//                    try {
//                        gameService.vote(voteRequest)
//                        println("[DEBUG_LOG] Player ${user.nickname} voted for ${targetPlayer.nickname}")
//
//
//                        val discussionMessage = generateDiscussionMessage(user, targetPlayer)
//                        sendChatMessage(user, discussionMessage, ChatMessageType.DISCUSSION)
//                        println("[DEBUG_LOG] Player ${user.nickname} sent discussion chat message")
//                    } catch (e: Exception) {
//                        println("[DEBUG_LOG] Failed to vote for ${user.nickname}: ${e.message}")
//                    }
//                }
//            }
//        }
//
//
//        printChatMessages(ChatMessageType.DISCUSSION, "Discussion ")
//
//
//        val gameState = gameService.getGameState(gameNumber)
//        val accusedPlayer = gameState.players.find { it.state == PlayerState.ACCUSED.name }
//
//        if (accusedPlayer != null) {
//            println("[DEBUG_LOG] Player ${accusedPlayer.nickname} was accused")
//
//            val accusedUser = users.find { it.nickname == accusedPlayer.nickname }
//            if (accusedUser != null) {
//                setCurrentUser(accusedUser.nickname)
//                val defense = "I am not the liar, I swear!"
//                val defendRequest = DefendRequest(gameNumber, defense)
//                try {
//                    gameService.defend(defendRequest)
//                    println("[DEBUG_LOG] Accused player ${accusedUser.nickname} defended: $defense")
//
//
//                    sendChatMessage(accusedUser, defense, ChatMessageType.DEFENSE)
//                    println("[DEBUG_LOG] Accused player ${accusedUser.nickname} sent defense chat message")
//                } catch (e: Exception) {
//                    println("[DEBUG_LOG] Failed to defend for ${accusedUser.nickname}: ${e.message}")
//                }
//            }
//
//
//            printChatMessages(ChatMessageType.DEFENSE, "Defense ")
//
//
//            users.forEach { user ->
//                if (user.playerId != null && user.nickname != accusedPlayer.nickname) {
//                    setCurrentUser(user.nickname)
//                    val voteToSurvive = decideSurvivalVote(user, accusedPlayer.nickname)
//                    val survivalVoteRequest = SurvivalVoteRequest(
//                        gNumber = gameNumber,
//                        accusedPlayerId = accusedPlayer.id,
//                        voteToSurvive = voteToSurvive
//                    )
//                    try {
//                        gameService.survivalVote(survivalVoteRequest)
//                        println("[DEBUG_LOG] Player ${user.nickname} voted ${if (voteToSurvive) "to survive" else "to eliminate"} ${accusedPlayer.nickname}")
//                    } catch (e: Exception) {
//                        println("[DEBUG_LOG] Failed to survival vote for ${user.nickname}: ${e.message}")
//                    }
//                }
//            }
//
//
//            val updatedGameState = gameService.getGameState(gameNumber)
//            val updatedAccusedPlayer = updatedGameState.players.find { it.id == accusedPlayer.id }
//
//            if (updatedAccusedPlayer != null &&
//                updatedAccusedPlayer.state == PlayerState.ELIMINATED.name) {
//
//                println("[DEBUG_LOG] Player ${updatedAccusedPlayer.nickname} was eliminated")
//
//
//                users.forEach { user ->
//                    if (user.playerId != null && user.nickname != updatedAccusedPlayer.nickname) {
//                        setCurrentUser(user.nickname)
//                        val postRoundMessage = generatePostRoundMessage(user, updatedAccusedPlayer.nickname, true)
//                        sendChatMessage(user, postRoundMessage, ChatMessageType.POST_ROUND)
//                        println("[DEBUG_LOG] Player ${user.nickname} sent post-round chat message")
//                    }
//                }
//
//
//                setCurrentUser(updatedAccusedPlayer.nickname)
//                val playerState = gameService.getGameState(gameNumber)
//
//                val playerRole = playerState.yourRole
//                if (playerRole != null && playerRole == PlayerRole.LIAR.name) {
//                    val guess = words.random()
//                    val guessWordRequest = GuessWordRequest(gameNumber, guess)
//                    try {
//                        gameService.guessWord(guessWordRequest)
//                        println("[DEBUG_LOG] Eliminated liar ${updatedAccusedPlayer.nickname} guessed: $guess")
//
//
//                        sendChatMessage(users.find { it.nickname == updatedAccusedPlayer.nickname }!!,
//                            "I was the liar! My guess is: $guess",
//                            ChatMessageType.POST_ROUND)
//                    } catch (e: Exception) {
//                        println("[DEBUG_LOG] Failed to guess word for ${updatedAccusedPlayer.nickname}: ${e.message}")
//                    }
//                }
//            } else {
//                println("[DEBUG_LOG] Player ${accusedPlayer.nickname} survived")
//
//
//                users.forEach { user ->
//                    if (user.playerId != null) {
//                        setCurrentUser(user.nickname)
//                        val postRoundMessage = generatePostRoundMessage(user, accusedPlayer.nickname, false)
//                        sendChatMessage(user, postRoundMessage, ChatMessageType.POST_ROUND)
//                        println("[DEBUG_LOG] Player ${user.nickname} sent post-round chat message")
//                    }
//                }
//            }
//
//
//            printChatMessages(ChatMessageType.POST_ROUND, "Post-round ")
//        }
//    }
//
//    private fun generateHint(user: UserInfo): String {
//        return when (user.role) {
//            PlayerRole.CITIZEN -> {
//                val word = words.random()
//                "This animal is related to ${word.substring(0, 1)}"
//            }
//            PlayerRole.LIAR -> {
//                "I'm thinking of something with legs"
//            }
//            else -> "I'm not sure what to say"
//        }
//    }
//
//    private fun selectPlayerToVoteFor(user: UserInfo): UserInfo? {
//        val potentialTargets = users.filter {
//            it.playerId != null && it.nickname != user.nickname
//        }
//
//        if (potentialTargets.isEmpty()) return null
//
//        return when (user.role) {
//            PlayerRole.CITIZEN -> {
//                potentialTargets.shuffled().firstOrNull()
//            }
//            PlayerRole.LIAR -> {
//                potentialTargets.shuffled().firstOrNull()
//            }
//            else -> potentialTargets.random()
//        }
//    }
//
//    private fun decideSurvivalVote(user: UserInfo, accusedNickname: String): Boolean {
//        val accusedUser = users.find { it.nickname == accusedNickname }
//
//        return when {
//            user.role == PlayerRole.LIAR && accusedUser?.role == PlayerRole.LIAR -> true
//            user.role == PlayerRole.LIAR && accusedUser?.role == PlayerRole.CITIZEN -> false
//            user.role == PlayerRole.CITIZEN && accusedUser?.role == PlayerRole.LIAR -> false
//            else -> Random.nextBoolean()
//        }
//    }
//
//    private fun generateDiscussionMessage(user: UserInfo, targetPlayer: UserInfo): String {
//        val suspiciousReasons = listOf(
//            "gave a vague hint",
//            "seems nervous",
//            "is contradicting themselves",
//            "doesn't seem to know much about the subject",
//            "is trying too hard to blend in"
//        )
//
//        return when (user.role) {
//            PlayerRole.CITIZEN -> {
//                if (targetPlayer.role == PlayerRole.LIAR) {
//                    "I think ${targetPlayer.nickname} is the liar because they ${suspiciousReasons.random()}"
//                } else {
//                    "I'm not sure, but ${targetPlayer.nickname} ${suspiciousReasons.random()}"
//                }
//            }
//            PlayerRole.LIAR -> {
//                "I suspect ${targetPlayer.nickname} because they ${suspiciousReasons.random()}"
//            }
//            else -> "I'm not sure who to vote for"
//        }
//    }
//
//    private fun generatePostRoundMessage(user: UserInfo, accusedNickname: String, wasEliminated: Boolean): String {
//        val accusedUser = users.find { it.nickname == accusedNickname }
//
//        return when {
//            user.nickname == accusedNickname && !wasEliminated ->
//                "Phew! That was close. Thanks for keeping me in the game!"
//            user.role == PlayerRole.LIAR && accusedUser?.role == PlayerRole.LIAR && wasEliminated ->
//                "Oh no! We lost a fellow liar."
//            user.role == PlayerRole.LIAR && accusedUser?.role == PlayerRole.CITIZEN && wasEliminated ->
//                "Good! One less citizen to worry about."
//            user.role == PlayerRole.CITIZEN && accusedUser?.role == PlayerRole.LIAR && wasEliminated ->
//                "Great job everyone! We caught a liar."
//            user.role == PlayerRole.CITIZEN && accusedUser?.role == PlayerRole.CITIZEN && wasEliminated ->
//                "Oh no! We eliminated one of our own."
//            else -> "Let's be more careful in the next round."
//        }
//    }
//
//    private fun sendChatMessage(user: UserInfo, content: String, type: ChatMessageType) {
//        setCurrentUser(user.nickname)
//        val request = SendChatMessageRequest(
//            gNumber = gameNumber,
//            content = content
//        )
//        try {
//            chatService.sendMessage(request)
//        } catch (e: Exception) {
//            println("[DEBUG_LOG] Failed to send chat message for ${user.nickname}: ${e.message}")
//        }
//    }
//
//    private fun getChatMessages(type: ChatMessageType? = null): List<ChatMessageEntity> {
//        val game = gameRepository.findBygNumber(gameNumber)
//            ?: throw RuntimeException("Game not found")
//
//        val allMessages = chatMessageRepository.findByGame(game)
//
//        return if (type != null) {
//            allMessages.filter { message -> message.type == type }
//        } else {
//            allMessages
//        }
//    }
//
//    private fun printChatMessages(type: ChatMessageType? = null, prefix: String = "") {
//        val messages = getChatMessages(type)
//        println("[DEBUG_LOG] ${prefix}Chat messages (${type ?: "ALL"}): ${messages.size}")
//        messages.forEach { message ->
//            println("[DEBUG_LOG] [${message.type}] ${message.player.nickname}: ${message.content}")
//        }
//    }
//
//    private fun printChatStatistics() {
//        val allMessages = getChatMessages()
//
//        println("\n=== Chat Statistics ===")
//        println("Total messages: ${allMessages.size}")
//
//        println("\nMessages by type:")
//        ChatMessageType.values().forEach { type ->
//            val count = allMessages.count { message -> message.type == type }
//            println("- $type: $count messages")
//        }
//
//        println("\nMessages by user:")
//        users.forEach { user ->
//            val count = allMessages.count { message -> message.player.nickname == user.nickname }
//            println("- ${user.nickname} (${user.role}): $count messages")
//        }
//    }
//
//    private fun setCurrentUser(nickname: String) {
//        val user = users.find { it.nickname == nickname }
//        if (user == null || user.userId == null) {
//            println("[DEBUG_LOG] Warning: User $nickname not found or has no userId")
//            return
//        }
//
//        val userPrincipal = org.example.kotlin_liargame.tools.security.UserPrincipal(
//            userId = user.userId!!,
//            nickname = nickname,
//            authorities = emptyList(),
//            providerId = "test"
//        )
//
//        val authentication = UsernamePasswordAuthenticationToken(userPrincipal, null, emptyList())
//        SecurityContextHolder.getContext().authentication = authentication
//    }
//}
