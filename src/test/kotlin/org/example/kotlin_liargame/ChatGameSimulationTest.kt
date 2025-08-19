//package org.example.kotlin_liargame
//
//import org.example.kotlin_liargame.domain.chat.model.ChatMessageType
//import kotlin.random.Random
//
//
//fun main() {
//    println("Starting Chat Game Simulation with 10 users")
//
//    val simulation = ChatGameSimulation()
//    simulation.runSimulation()
//}
//
//
//class ChatGameSimulation {
//    private val baseUrl = "http://119.201.51.128:8080"
//    private val users = mutableListOf<UserInfo>()
//    private var gameNumber: Int = 0
//    private val subjectContent = "동물"
//    private val words = listOf("사자", "호랑이", "코끼리", "기린", "팬더", "원숭이", "고양이", "하마", "뱀", "코알라")
//    private val chatMessages = mutableListOf<ChatMessage>()
//
//    data class UserInfo(
//        val nickname: String,
//        val profileImgUrl: String,
//        var role: String? = null,
//        var playerId: Long? = null
//    )
//
//    data class ChatMessage(
//        val sender: UserInfo,
//        val content: String,
//        val type: ChatMessageType,
//        val timestamp: Long = System.currentTimeMillis()
//    )
//
//    fun runSimulation() {
//        try {
//            createUsers()
//            registerSubject()
//            registerWords()
//            createGameRoom()
//            joinGame()
//            startGame()
//            playRounds()
//            getGameResult()
//
//
//            printChatStatistics()
//
//            println("Chat Simulation completed successfully!")
//        } catch (e: Exception) {
//            println("Simulation failed: ${e.message}")
//            e.printStackTrace()
//        }
//    }
//
//    private fun createUsers() {
//        println("\n=== Creating 10 users ===")
//
//        for (i in 1..10) {
//            val nickname = "Player${i}_${Random.nextInt(1000, 9999)}"
//            val profileImgUrl = "https://example.com/profile.png"
//            users.add(UserInfo(nickname, profileImgUrl))
//
//            println("Created user: $nickname")
//        }
//    }
//
//    private fun registerSubject() {
//        println("\n=== Registering subject: $subjectContent ===")
//
//        println("Registered subject: $subjectContent")
//    }
//
//    private fun registerWords() {
//        println("\n=== Registering words for subject: $subjectContent ===")
//
//        words.forEach { word ->
//            println("Registered word: $word")
//        }
//    }
//
//    private fun createGameRoom() {
//        println("\n=== Creating game room ===")
//
//        val firstUser = users[0]
//
//        gameNumber = 1
//        println("Created game room: $gameNumber")
//    }
//
//    private fun joinGame() {
//        println("\n=== Users joining game ===")
//
//        users.forEachIndexed { index, user ->
//            if (index > 0) {
//                println("User ${user.nickname} joined the game")
//
//
//                sendChatMessage(user, "Hello everyone! Ready to play?", ChatMessageType.POST_ROUND)
//            }
//        }
//
//
//        println("\n=== Pre-game chat ===")
//        printChatMessages(ChatMessageType.POST_ROUND)
//    }
//
//    private fun startGame() {
//        println("\n=== Starting game ===")
//
//        users.forEachIndexed { index, user ->
//            user.role = if (index < 2) "LIAR" else "CITIZEN"
//            user.playerId = (index + 1).toLong()
//            println("Player ${user.nickname} has role ${user.role} and ID ${user.playerId}")
//        }
//
//        println("Game started")
//    }
//
//    private fun playRounds() {
//        println("\n=== Playing rounds ===")
//
//        for (round in 1..3) {
//            println("\n--- Round $round ---")
//            playRound(round)
//        }
//    }
//
//    private fun playRound(round: Int) {
//
//        println("\n- Players giving hints")
//        users.forEach { user ->
//            val hint = generateHint(user)
//
//            println("Player ${user.nickname} (${user.role}) gave hint: $hint")
//
//
//            sendChatMessage(user, hint, ChatMessageType.HINT)
//        }
//
//
//        println("\n=== Hint chat ===")
//        printChatMessages(ChatMessageType.HINT)
//
//
//        println("\n- Players voting")
//        users.forEach { user ->
//            val targetPlayer = selectPlayerToVoteFor(user)
//
//            if (targetPlayer != null) {
//                println("Player ${user.nickname} voted for ${targetPlayer.nickname}")
//
//
//                val discussionMessage = generateDiscussionMessage(user, targetPlayer)
//                sendChatMessage(user, discussionMessage, ChatMessageType.DISCUSSION)
//            }
//        }
//
//
//        println("\n=== Discussion chat ===")
//        printChatMessages(ChatMessageType.DISCUSSION)
//
//        val accusedPlayer = users[2]
//        println("\n- Player ${accusedPlayer.nickname} was accused")
//
//
//        val defense = "I am not the liar, I swear!"
//
//        println("Accused player ${accusedPlayer.nickname} defended: $defense")
//
//
//        sendChatMessage(accusedPlayer, defense, ChatMessageType.DEFENSE)
//
//
//        println("\n=== Defense chat ===")
//        printChatMessages(ChatMessageType.DEFENSE)
//
//        println("\n- Players voting on survival")
//        users.forEach { user ->
//            if (user.nickname != accusedPlayer.nickname) {
//                val voteToSurvive = decideSurvivalVote(user, accusedPlayer)
//
//                println("Player ${user.nickname} voted ${if (voteToSurvive) "to survive" else "to eliminate"} ${accusedPlayer.nickname}")
//            }
//        }
//
//        val isEliminated = true
//
//        if (isEliminated) {
//            println("\n- Player ${accusedPlayer.nickname} was eliminated")
//
//            if (accusedPlayer.role == "LIAR") {
//                val guess = words.random()
//
//                println("Eliminated liar ${accusedPlayer.nickname} guessed: $guess")
//
//                println("The guess was incorrect, continuing to next round")
//            }
//        } else {
//            println("\n- Player ${accusedPlayer.nickname} survived")
//        }
//
//
//        println("\n- Post-round chat")
//        users.forEach { user ->
//            if (user != accusedPlayer || !isEliminated) {
//                val postRoundMessage = generatePostRoundMessage(user, accusedPlayer, isEliminated)
//                sendChatMessage(user, postRoundMessage, ChatMessageType.POST_ROUND)
//            }
//        }
//
//
//        println("\n=== Post-round chat ===")
//        printChatMessages(ChatMessageType.POST_ROUND)
//    }
//
//    private fun getGameResult() {
//        println("\n=== Getting game result ===")
//
//        println("Game result: CITIZENS win!")
//
//
//        println("\n=== Final chat ===")
//        users.forEach { user ->
//            val finalMessage = when (user.role) {
//                "CITIZEN" -> "Good game everyone! We citizens won!"
//                "LIAR" -> "You got me! Well played citizens."
//                else -> "Good game!"
//            }
//            sendChatMessage(user, finalMessage, ChatMessageType.POST_ROUND)
//        }
//
//        printChatMessages(ChatMessageType.POST_ROUND)
//    }
//
//    private fun generateHint(user: UserInfo): String {
//        return when (user.role) {
//            "CITIZEN" -> {
//                val word = words.random()
//                "This animal is related to ${word.substring(0, 1)}"
//            }
//            "LIAR" -> {
//                "I'm thinking of something with legs"
//            }
//            else -> "I'm not sure what to say"
//        }
//    }
//
//    private fun selectPlayerToVoteFor(user: UserInfo): UserInfo? {
//        val potentialTargets = users.filter {
//            it.nickname != user.nickname
//        }
//
//        if (potentialTargets.isEmpty()) return null
//
//        return when (user.role) {
//            "CITIZEN" -> {
//                potentialTargets.filter { it.role == "LIAR" }.randomOrNull()
//                    ?: potentialTargets.random()
//            }
//            "LIAR" -> {
//                potentialTargets.filter { it.role == "CITIZEN" }.randomOrNull()
//                    ?: potentialTargets.random()
//            }
//            else -> potentialTargets.random()
//        }
//    }
//
//    private fun decideSurvivalVote(user: UserInfo, accusedPlayer: UserInfo): Boolean {
//        return when {
//            user.role == "LIAR" && accusedPlayer.role == "LIAR" -> true
//            user.role == "LIAR" && accusedPlayer.role == "CITIZEN" -> false
//            user.role == "CITIZEN" && accusedPlayer.role == "LIAR" -> false
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
//            "CITIZEN" -> {
//                if (targetPlayer.role == "LIAR") {
//                    "I think ${targetPlayer.nickname} is the liar because they ${suspiciousReasons.random()}"
//                } else {
//                    "I'm not sure, but ${targetPlayer.nickname} ${suspiciousReasons.random()}"
//                }
//            }
//            "LIAR" -> {
//                "I suspect ${targetPlayer.nickname} because they ${suspiciousReasons.random()}"
//            }
//            else -> "I'm not sure who to vote for"
//        }
//    }
//
//    private fun generatePostRoundMessage(user: UserInfo, accusedPlayer: UserInfo, wasEliminated: Boolean): String {
//        return when {
//            user.nickname == accusedPlayer.nickname && !wasEliminated ->
//                "Phew! That was close. Thanks for keeping me in the game!"
//            user.role == "LIAR" && accusedPlayer.role == "LIAR" && wasEliminated ->
//                "Oh no! We lost a fellow liar."
//            user.role == "LIAR" && accusedPlayer.role == "CITIZEN" && wasEliminated ->
//                "Good! One less citizen to worry about."
//            user.role == "CITIZEN" && accusedPlayer.role == "LIAR" && wasEliminated ->
//                "Great job everyone! We caught a liar."
//            user.role == "CITIZEN" && accusedPlayer.role == "CITIZEN" && wasEliminated ->
//                "Oh no! We eliminated one of our own."
//            else -> "Let's be more careful in the next round."
//        }
//    }
//
//    private fun sendChatMessage(sender: UserInfo, content: String, type: ChatMessageType) {
//        val message = ChatMessage(sender, content, type)
//        chatMessages.add(message)
//    }
//
//    private fun printChatMessages(type: ChatMessageType? = null) {
//        val filteredMessages = if (type != null) {
//            chatMessages.filter { it.type == type }
//        } else {
//            chatMessages
//        }
//
//        filteredMessages.takeLast(10).forEach { message ->
//            println("[${message.type}] ${message.sender.nickname}: ${message.content}")
//        }
//    }
//
//    private fun printChatStatistics() {
//        println("\n=== Chat Statistics ===")
//        println("Total messages: ${chatMessages.size}")
//        println("Messages by type:")
//        ChatMessageType.values().forEach { type ->
//            val count = chatMessages.count { it.type == type }
//            println("- $type: $count messages")
//        }
//
//        println("\nMessages by user:")
//        users.forEach { user ->
//            val count = chatMessages.count { it.sender.nickname == user.nickname }
//            println("- ${user.nickname} (${user.role}): $count messages")
//        }
//    }
//}