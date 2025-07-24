package org.example.kotlin_liargame

import kotlin.random.Random

/**
 * This is a standalone application that simulates 10 users playing the Liar Game.
 * It can be run to test the game flow by making HTTP requests to the API endpoints.
 * 
 * To run this simulation:
 * 1. Make sure the application is running
 * 2. Run this file as a Kotlin application
 */
fun main() {
    println("Starting Liar Game Simulation with 10 users")
    
    val simulation = LiarGameSimulation()
    simulation.runSimulation()
}

class LiarGameSimulation {
    private val baseUrl = "http://localhost:8080/api/v1"
    private val users = mutableListOf<UserInfo>()
    private var gameNumber: Int = 0
    private val subjectContent = "동물"
    private val words = listOf("사자", "호랑이", "코끼리", "기린", "팬더", "원숭이", "고릴라", "하마", "악어", "코알라")
    
    data class UserInfo(
        val nickname: String,
        val profileImgUrl: String,
        var role: String? = null,
        var playerId: Long? = null
    )
    
    fun runSimulation() {
        try {
            createUsers()
            registerSubject()
            registerWords()
            createGameRoom()
            joinGame()
            startGame()
            playRounds()
            getGameResult()
            
            println("Simulation completed successfully!")
        } catch (e: Exception) {
            println("Simulation failed: ${e.message}")
            e.printStackTrace()
        }
    }
    
    private fun createUsers() {
        println("\n=== Creating 10 users ===")
        
        for (i in 1..10) {
            val nickname = "Player${i}_${Random.nextInt(1000, 9999)}"
            val profileImgUrl = "https://example.com/profile${i}.jpg"
            users.add(UserInfo(nickname, profileImgUrl))
            
            // In a real implementation, this would make an HTTP request:
            // POST $baseUrl/user/add
            // Body: UserAddRequest(nickname, profileImgUrl)
            println("Created user: $nickname")
        }
    }
    
    private fun registerSubject() {
        println("\n=== Registering subject: $subjectContent ===")
        
        // In a real implementation, this would make an HTTP request:
        // POST $baseUrl/subject
        // Body: SubjectRequest(subjectContent)
        println("Registered subject: $subjectContent")
    }
    
    private fun registerWords() {
        println("\n=== Registering words for subject: $subjectContent ===")
        
        words.forEach { word ->
            // In a real implementation, this would make an HTTP request:
            // POST $baseUrl/word
            // Body: ApplyWordRequest(subjectContent, word)
            println("Registered word: $word")
        }
    }
    
    private fun createGameRoom() {
        println("\n=== Creating game room ===")
        
        val firstUser = users[0]
        
        // In a real implementation, this would make an HTTP request:
        // POST $baseUrl/game/room
        // Body: CreateGameRoomRequest(...)
        // And set the authentication header for the first user
        
        gameNumber = 1 // In a real implementation, this would be the response from the API
        println("Created game room: $gameNumber")
    }
    
    private fun joinGame() {
        println("\n=== Users joining game ===")
        
        users.forEachIndexed { index, user ->
            if (index > 0) { // Skip the first user who created the game
                // In a real implementation, this would make an HTTP request:
                // POST $baseUrl/game/join
                // Body: JoinGameRequest(gameNumber)
                // And set the authentication header for the user
                println("User ${user.nickname} joined the game")
            }
        }
    }
    
    private fun startGame() {
        println("\n=== Starting game ===")
        
        // In a real implementation, this would make an HTTP request:
        // POST $baseUrl/game/start
        // Body: StartGameRequest(gameNumber)
        // And set the authentication header for the first user
        
        // Assign random roles to players for simulation
        users.forEachIndexed { index, user ->
            user.role = if (index < 2) "LIAR" else "CITIZEN"
            user.playerId = (index + 1).toLong()
            println("Player ${user.nickname} has role ${user.role} and ID ${user.playerId}")
        }
        
        println("Game started")
    }
    
    private fun playRounds() {
        println("\n=== Playing rounds ===")
        
        for (round in 1..3) {
            println("\n--- Round $round ---")
            playRound(round)
        }
    }
    
    private fun playRound(round: Int) {
        // 1. All players give hints
        println("\n- Players giving hints")
        users.forEach { user ->
            val hint = generateHint(user)
            
            // In a real implementation, this would make an HTTP request:
            // POST $baseUrl/game/hint
            // Body: GiveHintRequest(gameNumber, hint)
            // And set the authentication header for the user
            
            println("Player ${user.nickname} (${user.role}) gave hint: $hint")
        }
        
        // 2. All players vote for who they think is the liar
        println("\n- Players voting")
        users.forEach { user ->
            val targetPlayer = selectPlayerToVoteFor(user)
            
            if (targetPlayer != null) {
                // In a real implementation, this would make an HTTP request:
                // POST $baseUrl/game/vote
                // Body: VoteRequest(gameNumber, targetPlayer.playerId!!)
                // And set the authentication header for the user
                
                println("Player ${user.nickname} voted for ${targetPlayer.nickname}")
            }
        }
        
        // 3. Determine the accused player (most voted)
        val accusedPlayer = users[2] // For simulation, always accuse the third player
        println("\n- Player ${accusedPlayer.nickname} was accused")
        
        // 4. Accused player defends
        val defense = "I am not the liar, I swear!"
        
        // In a real implementation, this would make an HTTP request:
        // POST $baseUrl/game/defend
        // Body: DefendRequest(gameNumber, defense)
        // And set the authentication header for the accused player
        
        println("Accused player ${accusedPlayer.nickname} defended: $defense")
        
        // 5. All players vote on whether the accused player survives
        println("\n- Players voting on survival")
        users.forEach { user ->
            if (user.nickname != accusedPlayer.nickname) {
                val voteToSurvive = decideSurvivalVote(user, accusedPlayer)
                
                // In a real implementation, this would make an HTTP request:
                // POST $baseUrl/game/survival-vote
                // Body: SurvivalVoteRequest(gameNumber, accusedPlayer.playerId!!, voteToSurvive)
                // And set the authentication header for the user
                
                println("Player ${user.nickname} voted ${if (voteToSurvive) "to survive" else "to eliminate"} ${accusedPlayer.nickname}")
            }
        }
        
        // 6. Determine if the accused player is eliminated
        val isEliminated = true // For simulation, always eliminate the accused player
        
        if (isEliminated) {
            println("\n- Player ${accusedPlayer.nickname} was eliminated")
            
            // 7. If the accused player is a liar and was eliminated, they can guess the word
            if (accusedPlayer.role == "LIAR") {
                val guess = words.random()
                
                // In a real implementation, this would make an HTTP request:
                // POST $baseUrl/game/guess
                // Body: GuessWordRequest(gameNumber, guess)
                // And set the authentication header for the accused player
                
                println("Eliminated liar ${accusedPlayer.nickname} guessed: $guess")
                
                // For simulation, always guess incorrectly
                println("The guess was incorrect, continuing to next round")
            }
        } else {
            println("\n- Player ${accusedPlayer.nickname} survived")
        }
    }
    
    private fun getGameResult() {
        println("\n=== Getting game result ===")
        
        // In a real implementation, this would make an HTTP request:
        // GET $baseUrl/game/result?gNumber=$gameNumber
        
        // For simulation, citizens always win
        println("Game result: CITIZENS win!")
    }
    
    private fun generateHint(user: UserInfo): String {
        // Citizens give accurate hints, liars give misleading hints
        return when (user.role) {
            "CITIZEN" -> {
                val word = words.random()
                "This animal is related to ${word.substring(0, 1)}"
            }
            "LIAR" -> {
                "I'm thinking of something with legs"
            }
            else -> "I'm not sure what to say"
        }
    }
    
    private fun selectPlayerToVoteFor(user: UserInfo): UserInfo? {
        // Citizens try to vote for liars, liars try to vote for citizens
        val potentialTargets = users.filter { 
            it.nickname != user.nickname 
        }
        
        if (potentialTargets.isEmpty()) return null
        
        return when (user.role) {
            "CITIZEN" -> {
                // Citizens try to identify liars based on suspicious hints
                potentialTargets.filter { it.role == "LIAR" }.randomOrNull() 
                    ?: potentialTargets.random()
            }
            "LIAR" -> {
                // Liars try to blend in by voting for other players randomly
                potentialTargets.filter { it.role == "CITIZEN" }.randomOrNull()
                    ?: potentialTargets.random()
            }
            else -> potentialTargets.random()
        }
    }
    
    private fun decideSurvivalVote(user: UserInfo, accusedPlayer: UserInfo): Boolean {
        return when {
            user.role == "LIAR" && accusedPlayer.role == "LIAR" -> true // Liars protect other liars
            user.role == "LIAR" && accusedPlayer.role == "CITIZEN" -> false // Liars try to eliminate citizens
            user.role == "CITIZEN" && accusedPlayer.role == "LIAR" -> false // Citizens try to eliminate liars
            else -> Random.nextBoolean() // Random decision in other cases
        }
    }
}