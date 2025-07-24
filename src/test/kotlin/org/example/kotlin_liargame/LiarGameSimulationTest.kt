package org.example.kotlin_liargame

import org.example.kotlin_liargame.domain.game.dto.request.*
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.service.GameService
import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.service.SubjectService
import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.service.UserService
import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
import org.example.kotlin_liargame.domain.word.service.WordService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.annotation.Rollback
import org.springframework.transaction.annotation.Transactional
import kotlin.random.Random

@SpringBootTest
@Transactional
@Rollback
class LiarGameSimulationTest {

    @Autowired
    private lateinit var userService: UserService

    @Autowired
    private lateinit var subjectService: SubjectService

    @Autowired
    private lateinit var wordService: WordService

    @Autowired
    private lateinit var gameService: GameService

    private val users = mutableListOf<UserInfo>()
    private var gameNumber: Int = 0
    private var subjectContent = "동물"
    private val words = listOf("사자", "호랑이", "코끼리", "기린", "팬더", "원숭이", "고릴라", "하마", "악어", "코알라")

    data class UserInfo(
        val nickname: String,
        val profileImgUrl: String,
        var role: PlayerRole? = null,
        var playerId: Long? = null
    )

    @BeforeEach
    fun setup() {
        // Create 10 users with random nicknames
        for (i in 1..10) {
            val nickname = "Player${i}_${Random.nextInt(1000, 9999)}"
            val profileImgUrl = "https://example.com/profile${i}.jpg"
            users.add(UserInfo(nickname, profileImgUrl))
            
            try {
                userService.createUser(UserAddRequest(nickname, profileImgUrl))
                println("[DEBUG_LOG] Created user: $nickname")
            } catch (e: Exception) {
                println("[DEBUG_LOG] Failed to create user $nickname: ${e.message}")
            }
        }

        // Register a subject
        try {
            subjectService.applySubject(SubjectRequest(subjectContent))
            println("[DEBUG_LOG] Created subject: $subjectContent")
        } catch (e: Exception) {
            println("[DEBUG_LOG] Failed to create subject $subjectContent: ${e.message}")
        }

        // Register words for the subject
        words.forEach { word ->
            try {
                wordService.applyWord(ApplyWordRequest(subjectContent, word))
                println("[DEBUG_LOG] Added word: $word to subject: $subjectContent")
            } catch (e: Exception) {
                println("[DEBUG_LOG] Failed to add word $word to subject $subjectContent: ${e.message}")
            }
        }
    }

    @Test
    fun `simulate liar game with 10 users`() {
        // 1. Create a game room with the first user
        val firstUser = users[0]
        setCurrentUser(firstUser.nickname)
        
        val createGameRequest = CreateGameRoomRequest(
            nickname = firstUser.nickname,
            gName = "Test Game",
            gPassword = null,
            gParticipants = 10,
            gTotalRounds = 3,
            gLiarCount = 2,
            gGameMode = GameMode.LIARS_KNOW
        )
        
        gameNumber = gameService.createGameRoom(createGameRequest)
        println("[DEBUG_LOG] Created game room: $gameNumber")

        // 2. Make all users join the game
        users.forEachIndexed { index, user ->
            if (index > 0) { // Skip the first user who created the game
                setCurrentUser(user.nickname)
                val joinGameRequest = JoinGameRequest(gameNumber)
                val gameState = gameService.joinGame(joinGameRequest)
                println("[DEBUG_LOG] User ${user.nickname} joined the game")
            }
        }

        // 3. Start the game
        setCurrentUser(firstUser.nickname)
        val startGameRequest = StartGameRequest(gameNumber)
        var gameState = gameService.startGame(startGameRequest)
        println("[DEBUG_LOG] Game started")

        // Store player IDs and roles
        gameState.players.forEach { player ->
            val user = users.find { it.nickname == player.nickname }
            user?.playerId = player.id
            user?.role = player.role
            println("[DEBUG_LOG] Player ${player.nickname} has role ${player.role} and ID ${player.id}")
        }

        // 4. Play multiple rounds
        for (round in 1..gameState.game.gTotalRounds) {
            println("[DEBUG_LOG] Starting round $round")
            playRound(gameState)
            
            // Check if game is over
            val currentGameState = gameService.getGameState(gameNumber)
            if (currentGameState.game.gState.name == "ENDED") {
                println("[DEBUG_LOG] Game ended after round $round")
                break
            }
        }

        // 5. Get final game result
        val gameResult = gameService.getGameResult(gameNumber)
        println("[DEBUG_LOG] Game result: ${gameResult.winningTeam}")
    }

    private fun playRound(initialGameState: GameStateResponse) {
        // 1. All players give hints
        users.forEach { user ->
            if (user.playerId != null) {
                setCurrentUser(user.nickname)
                val hint = generateHint(user)
                val giveHintRequest = GiveHintRequest(gameNumber, hint)
                try {
                    gameService.giveHint(giveHintRequest)
                    println("[DEBUG_LOG] Player ${user.nickname} gave hint: $hint")
                } catch (e: Exception) {
                    println("[DEBUG_LOG] Failed to give hint for ${user.nickname}: ${e.message}")
                }
            }
        }

        // 2. All players vote for who they think is the liar
        users.forEach { user ->
            if (user.playerId != null) {
                setCurrentUser(user.nickname)
                val targetPlayer = selectPlayerToVoteFor(user)
                if (targetPlayer != null) {
                    val voteRequest = VoteRequest(gameNumber, targetPlayer.playerId!!)
                    try {
                        gameService.vote(voteRequest)
                        println("[DEBUG_LOG] Player ${user.nickname} voted for ${targetPlayer.nickname}")
                    } catch (e: Exception) {
                        println("[DEBUG_LOG] Failed to vote for ${user.nickname}: ${e.message}")
                    }
                }
            }
        }

        // 3. Get the accused player
        val gameState = gameService.getGameState(gameNumber)
        val accusedPlayer = gameState.players.find { it.state == PlayerState.ACCUSED }
        
        if (accusedPlayer != null) {
            println("[DEBUG_LOG] Player ${accusedPlayer.nickname} was accused")
            
            // 4. Accused player defends
            val accusedUser = users.find { it.nickname == accusedPlayer.nickname }
            if (accusedUser != null) {
                setCurrentUser(accusedUser.nickname)
                val defense = "I am not the liar, I swear!"
                val defendRequest = DefendRequest(gameNumber, defense)
                try {
                    gameService.defend(defendRequest)
                    println("[DEBUG_LOG] Accused player ${accusedUser.nickname} defended: $defense")
                } catch (e: Exception) {
                    println("[DEBUG_LOG] Failed to defend for ${accusedUser.nickname}: ${e.message}")
                }
            }

            // 5. All players vote on whether the accused player survives
            users.forEach { user ->
                if (user.playerId != null && user.nickname != accusedPlayer.nickname) {
                    setCurrentUser(user.nickname)
                    val voteToSurvive = decideSurvivalVote(user, accusedPlayer.nickname)
                    val survivalVoteRequest = SurvivalVoteRequest(
                        gNumber = gameNumber,
                        accusedPlayerId = accusedPlayer.id,
                        voteToSurvive = voteToSurvive
                    )
                    try {
                        gameService.survivalVote(survivalVoteRequest)
                        println("[DEBUG_LOG] Player ${user.nickname} voted ${if (voteToSurvive) "to survive" else "to eliminate"} ${accusedPlayer.nickname}")
                    } catch (e: Exception) {
                        println("[DEBUG_LOG] Failed to survival vote for ${user.nickname}: ${e.message}")
                    }
                }
            }

            // 6. If the accused player is a liar and was eliminated, they can guess the word
            val updatedGameState = gameService.getGameState(gameNumber)
            val updatedAccusedPlayer = updatedGameState.players.find { it.id == accusedPlayer.id }
            
            if (updatedAccusedPlayer != null && 
                updatedAccusedPlayer.state == PlayerState.ELIMINATED && 
                updatedAccusedPlayer.role == PlayerRole.LIAR) {
                
                setCurrentUser(updatedAccusedPlayer.nickname)
                val guess = words.random() // Liar makes a random guess
                val guessWordRequest = GuessWordRequest(gameNumber, guess)
                try {
                    val result = gameService.guessWord(guessWordRequest)
                    println("[DEBUG_LOG] Eliminated liar ${updatedAccusedPlayer.nickname} guessed: $guess")
                } catch (e: Exception) {
                    println("[DEBUG_LOG] Failed to guess word for ${updatedAccusedPlayer.nickname}: ${e.message}")
                }
            }
        }
    }

    private fun generateHint(user: UserInfo): String {
        // Citizens give accurate hints, liars give misleading hints
        return when (user.role) {
            PlayerRole.CITIZEN -> {
                val word = words.random()
                "This animal is related to ${word.substring(0, 1)}"
            }
            PlayerRole.LIAR -> {
                "I'm thinking of something with legs"
            }
            else -> "I'm not sure what to say"
        }
    }

    private fun selectPlayerToVoteFor(user: UserInfo): UserInfo? {
        // Citizens try to vote for liars, liars try to vote for citizens
        val potentialTargets = users.filter { 
            it.playerId != null && it.nickname != user.nickname 
        }
        
        if (potentialTargets.isEmpty()) return null
        
        return when (user.role) {
            PlayerRole.CITIZEN -> {
                // Citizens try to identify liars based on suspicious hints
                potentialTargets.shuffled().firstOrNull()
            }
            PlayerRole.LIAR -> {
                // Liars try to blend in by voting for other players randomly
                potentialTargets.shuffled().firstOrNull()
            }
            else -> potentialTargets.random()
        }
    }

    private fun decideSurvivalVote(user: UserInfo, accusedNickname: String): Boolean {
        val accusedUser = users.find { it.nickname == accusedNickname }
        
        return when {
            user.role == PlayerRole.LIAR && accusedUser?.role == PlayerRole.LIAR -> true // Liars protect other liars
            user.role == PlayerRole.LIAR && accusedUser?.role == PlayerRole.CITIZEN -> false // Liars try to eliminate citizens
            user.role == PlayerRole.CITIZEN && accusedUser?.role == PlayerRole.LIAR -> false // Citizens try to eliminate liars
            else -> Random.nextBoolean() // Random decision in other cases
        }
    }

    private fun setCurrentUser(nickname: String) {
        // Set the current user in the security context
        val authentication = UsernamePasswordAuthenticationToken(nickname, null, emptyList())
        SecurityContextHolder.getContext().authentication = authentication
    }
}