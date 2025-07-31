package org.example.kotlin_liargame

import kotlin.random.Random

fun main() {
    println("Starting Liar Game Simulation with 10 users")
    
    val simulation = LiarGameSimulation()
    simulation.runSimulation()
}

class LiarGameSimulation {
    private val baseUrl = "http:
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
            val profileImgUrl = "https:
            users.add(UserInfo(nickname, profileImgUrl))
            
            println("Created user: $nickname")
        }
    }
    
    private fun registerSubject() {
        println("\n=== Registering subject: $subjectContent ===")
        
        println("Registered subject: $subjectContent")
    }
    
    private fun registerWords() {
        println("\n=== Registering words for subject: $subjectContent ===")
        
        words.forEach { word ->
            println("Registered word: $word")
        }
    }
    
    private fun createGameRoom() {
        println("\n=== Creating game room ===")
        
        val firstUser = users[0]
        
        gameNumber = 1
        println("Created game room: $gameNumber")
    }
    
    private fun joinGame() {
        println("\n=== Users joining game ===")
        
        users.forEachIndexed { index, user ->
            if (index > 0) {
                println("User ${user.nickname} joined the game")
            }
        }
    }
    
    private fun startGame() {
        println("\n=== Starting game ===")
        
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
        println("\n- Players giving hints")
        users.forEach { user ->
            val hint = generateHint(user)
            
            println("Player ${user.nickname} (${user.role}) gave hint: $hint")
        }
        
        println("\n- Players voting")
        users.forEach { user ->
            val targetPlayer = selectPlayerToVoteFor(user)
            
            if (targetPlayer != null) {
                println("Player ${user.nickname} voted for ${targetPlayer.nickname}")
            }
        }
        
        val accusedPlayer = users[2]
        println("\n- Player ${accusedPlayer.nickname} was accused")
        
        val defense = "I am not the liar, I swear!"
        
        println("Accused player ${accusedPlayer.nickname} defended: $defense")
        
        println("\n- Players voting on survival")
        users.forEach { user ->
            if (user.nickname != accusedPlayer.nickname) {
                val voteToSurvive = decideSurvivalVote(user, accusedPlayer)
                
                println("Player ${user.nickname} voted ${if (voteToSurvive) "to survive" else "to eliminate"} ${accusedPlayer.nickname}")
            }
        }
        
        val isEliminated = true
        
        if (isEliminated) {
            println("\n- Player ${accusedPlayer.nickname} was eliminated")
            
            if (accusedPlayer.role == "LIAR") {
                val guess = words.random()
                
                println("Eliminated liar ${accusedPlayer.nickname} guessed: $guess")
                
                println("The guess was incorrect, continuing to next round")
            }
        } else {
            println("\n- Player ${accusedPlayer.nickname} survived")
        }
    }
    
    private fun getGameResult() {
        println("\n=== Getting game result ===")
        
        println("Game result: CITIZENS win!")
    }
    
    private fun generateHint(user: UserInfo): String {
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
        val potentialTargets = users.filter { 
            it.nickname != user.nickname 
        }
        
        if (potentialTargets.isEmpty()) return null
        
        return when (user.role) {
            "CITIZEN" -> {
                potentialTargets.filter { it.role == "LIAR" }.randomOrNull() 
                    ?: potentialTargets.random()
            }
            "LIAR" -> {
                potentialTargets.filter { it.role == "CITIZEN" }.randomOrNull()
                    ?: potentialTargets.random()
            }
            else -> potentialTargets.random()
        }
    }
    
    private fun decideSurvivalVote(user: UserInfo, accusedPlayer: UserInfo): Boolean {
        return when {
            user.role == "LIAR" && accusedPlayer.role == "LIAR" -> true
            user.role == "LIAR" && accusedPlayer.role == "CITIZEN" -> false
            user.role == "CITIZEN" && accusedPlayer.role == "LIAR" -> false
            else -> Random.nextBoolean()
        }
    }
}
