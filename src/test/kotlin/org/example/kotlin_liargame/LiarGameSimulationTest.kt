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
import org.springframework.transaction.annotation.Transactional
import kotlin.random.Random

@SpringBootTest
@Transactional
class LiarGameSimulationTest {

    @Autowired
    private lateinit var userService: UserService

    @Autowired
    private lateinit var subjectService: SubjectService

    @Autowired
    private lateinit var wordService: WordService

    @Autowired
    private lateinit var gameService: GameService
    
    @Autowired
    private lateinit var userRepository: org.example.kotlin_liargame.domain.user.repository.UserRepository

    private val users = mutableListOf<UserInfo>()
    private var gameNumber: Int = 0
    private var subjectContent = "동물_${System.currentTimeMillis()}"
    private val words = listOf("사자", "호랑이", "코끼리", "기린", "팬더", "원숭이", "고릴라", "하마", "악어", "코알라")

    data class UserInfo(
        val nickname: String,
        val profileImgUrl: String,
        var userId: Long? = null,
        var role: PlayerRole? = null,
        var playerId: Long? = null
    )

    @BeforeEach
    fun setup() {
        for (i in 1..12) {
            val nickname = "Player${i}_${Random.nextInt(1000, 9999)}"
            val profileImgUrl = "https:
            users.add(UserInfo(nickname, profileImgUrl))
            
            try {
                userService.createUser(UserAddRequest(nickname, profileImgUrl))
                val userEntity = userRepository.findByNickname(nickname)
                if (userEntity != null) {
                    users.last().userId = userEntity.id
                    println("[DEBUG_LOG] Created user: $nickname with ID: ${userEntity.id}")
                } else {
                    println("[DEBUG_LOG] Created user: $nickname but couldn't find user ID")
                }
            } catch (e: Exception) {
                println("[DEBUG_LOG] Failed to create user $nickname: ${e.message}")
            }
        }

        val existingSubjects = subjectService.findAll().filter { it.content == subjectContent }
        if (existingSubjects.isEmpty()) {
            try {
                subjectService.applySubject(SubjectRequest(subjectContent))
                println("[DEBUG_LOG] Created subject: $subjectContent")
            } catch (e: Exception) {
                println("[DEBUG_LOG] Failed to create subject $subjectContent: ${e.message}")
            }
        } else {
            println("[DEBUG_LOG] Subject '$subjectContent' already exists, using it")
        }

        words.forEach { word ->
            try {
                wordService.applyWord(ApplyWordRequest(subjectContent, word))
                println("[DEBUG_LOG] Added word: $word to subject: $subjectContent")
            } catch (e: Exception) {
                println("[DEBUG_LOG] Failed to add word $word to subject $subjectContent: ${e.message}")
            }
        }

        val subjectWords = wordService.findAll().filter { it.subjectContent == subjectContent }
        println("[DEBUG_LOG] Subject '$subjectContent' has ${subjectWords.size} words")
        if (subjectWords.size < 2) {
            throw RuntimeException("Subject '$subjectContent' must have at least 2 words for the test to run")
        }
    }

    @Test
    fun `test subject and word creation`() {
        val existingSubjects = subjectService.findAll().filter { it.content == subjectContent }
        if (existingSubjects.isEmpty()) {
            try {
                subjectService.applySubject(SubjectRequest(subjectContent))
                println("[DEBUG_LOG] Created subject: $subjectContent")
            } catch (e: Exception) {
                println("[DEBUG_LOG] Failed to create subject $subjectContent: ${e.message}")
            }
        } else {
            println("[DEBUG_LOG] Subject '$subjectContent' already exists, using it")
        }

        words.forEach { word ->
            try {
                wordService.applyWord(ApplyWordRequest(subjectContent, word))
                println("[DEBUG_LOG] Added word: $word to subject: $subjectContent")
            } catch (e: Exception) {
                println("[DEBUG_LOG] Failed to add word $word to subject $subjectContent: ${e.message}")
            }
        }

        val subjectWords = wordService.findAll().filter { it.subjectContent == subjectContent }
        println("[DEBUG_LOG] Subject '$subjectContent' has ${subjectWords.size} words")
        if (subjectWords.size < 2) {
            throw RuntimeException("Subject '$subjectContent' must have at least 2 words for the test to run")
        }

        val allSubjects = subjectService.findAll()
        println("[DEBUG_LOG] Available subjects: ${allSubjects.size}")

        val ourSubject = allSubjects.find { it.content == subjectContent }
        if (ourSubject == null) {
            throw RuntimeException("Subject '$subjectContent' not found")
        }
        
        println("[DEBUG_LOG] Our subject: ${ourSubject.content}, ID: ${ourSubject.id}")
        val ourWords = wordService.findAll().filter { it.subjectContent == ourSubject.content }
        println("[DEBUG_LOG] Words for our subject: ${ourWords.size}")
        ourWords.forEach { word ->
            println("[DEBUG_LOG] - ${word.content}")
        }

        if (ourWords.size < 2) {
            throw RuntimeException("Subject '$subjectContent' must have at least 2 words for the test to run")
        }

        println("[DEBUG_LOG] Test passed: Subject and word creation works correctly")
        println("[DEBUG_LOG] Subject '${ourSubject.content}' has ${ourWords.size} words")
        println("[DEBUG_LOG] This confirms that the database is working correctly for tests")

    }

    @Test
    fun `simulate liar game with 12 users`() {
        val firstUser = users[0]
        setCurrentUser(firstUser.nickname)
        
        val createGameRequest = CreateGameRoomRequest(
            nickname = firstUser.nickname,
            gName = "Test Game",
            gPassword = null,
            gParticipants = 12,
            gTotalRounds = 3,
            gLiarCount = 2,
            gGameMode = GameMode.LIARS_KNOW
        )
        
        gameNumber = gameService.createGameRoom(createGameRequest)
        println("[DEBUG_LOG] Created game room: $gameNumber")

        users.forEachIndexed { index, user ->
            if (index > 0) {
                setCurrentUser(user.nickname)
                val joinGameRequest = JoinGameRequest(gameNumber)
                val gameState = gameService.joinGame(joinGameRequest)
                println("[DEBUG_LOG] User ${user.nickname} joined the game")
            }
        }

        
        val allSubjects = subjectService.findAll()
        println("[DEBUG_LOG] Available subjects: ${allSubjects.size}")
        
        
        val ourSubject = allSubjects.find { it.content == subjectContent }
        if (ourSubject == null) {
            throw RuntimeException("Subject '$subjectContent' not found")
        }
        
        println("[DEBUG_LOG] Our subject: ${ourSubject.content}, ID: ${ourSubject.id}")
        val ourWords = wordService.findAll().filter { it.subjectContent == ourSubject.content }
        println("[DEBUG_LOG] Words for our subject: ${ourWords.size}")
        ourWords.forEach { word ->
            println("[DEBUG_LOG] - ${word.content}")
        }
        
        
        if (ourWords.size < 2) {
            throw RuntimeException("Subject '$subjectContent' must have at least 2 words for the test to run")
        }
        
        
        val otherSubject = allSubjects.filter { it.content != subjectContent }
            .firstOrNull { subject ->
                val subjectWords = wordService.findAll().filter { it.subjectContent == subject.content }
                subjectWords.size >= 2
            }
        
        setCurrentUser(firstUser.nickname)
        val startGameRequest = if (otherSubject != null) {
            println("[DEBUG_LOG] Using specific subject IDs: ${ourSubject.id}, ${otherSubject.id}")
            StartGameRequest(
                subjectIds = listOf(ourSubject.id, otherSubject.id)
            )
        } else {
            println("[DEBUG_LOG] Using only our subject ID: ${ourSubject.id}")
            StartGameRequest(
                subjectIds = listOf(ourSubject.id)
            )
        }
        println("[DEBUG_LOG] Starting game with specific subject IDs")
        var gameState: GameStateResponse
        try {
            gameState = gameService.startGame(startGameRequest)
            println("[DEBUG_LOG] Game started with specific subject IDs")
        } catch (e: Exception) {
            println("[DEBUG_LOG] Failed to start game: ${e.javaClass.name}: ${e.message}")
            e.printStackTrace()
            throw e
        }

        gameState.players.forEach { player ->
            val user = users.find { it.nickname == player.nickname }
            user?.playerId = player.id
            println("[DEBUG_LOG] Player ${player.nickname} has ID ${player.id}")
        }
        
        val principal = SecurityContextHolder.getContext().authentication.principal as org.example.kotlin_liargame.tools.security.UserPrincipal
        val currentUser = users.find { it.nickname == principal.nickname }
        val yourRole = gameState.yourRole
        if (currentUser != null && yourRole != null) {
            currentUser.role = PlayerRole.valueOf(yourRole)
            println("[DEBUG_LOG] Current user ${currentUser.nickname} has role $yourRole")
        }

        for (round in 1..gameState.gTotalRounds) {
            println("[DEBUG_LOG] Starting round $round")
            playRound(gameState)
            
            val currentGameState = gameService.getGameState(gameNumber)
            if (currentGameState.gState.name == "ENDED") {
                println("[DEBUG_LOG] Game ended after round $round")
                val gameResult = gameService.getGameResult(gameNumber)
                println("[DEBUG_LOG] Game result: ${gameResult.winningTeam}")
                break
            }
        }

    }

    private fun playRound(initialGameState: GameStateResponse) {
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

        val gameState = gameService.getGameState(gameNumber)
        val accusedPlayer = gameState.players.find { it.state == PlayerState.ACCUSED.name }
        
        if (accusedPlayer != null) {
            println("[DEBUG_LOG] Player ${accusedPlayer.nickname} was accused")
            
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

            val updatedGameState = gameService.getGameState(gameNumber)
            val updatedAccusedPlayer = updatedGameState.players.find { it.id == accusedPlayer.id }
            
            if (updatedAccusedPlayer != null && 
                updatedAccusedPlayer.state == PlayerState.ELIMINATED.name) {
                
                setCurrentUser(updatedAccusedPlayer.nickname)
                val playerState = gameService.getGameState(gameNumber)
                
                val playerRole = playerState.yourRole
                if (playerRole != null && playerRole == PlayerRole.LIAR.name) {
                    val guess = words.random()
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
    }

    private fun generateHint(user: UserInfo): String {
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
        val potentialTargets = users.filter { 
            it.playerId != null && it.nickname != user.nickname 
        }
        
        if (potentialTargets.isEmpty()) return null
        
        return when (user.role) {
            PlayerRole.CITIZEN -> {
                potentialTargets.shuffled().firstOrNull()
            }
            PlayerRole.LIAR -> {
                potentialTargets.shuffled().firstOrNull()
            }
            else -> potentialTargets.random()
        }
    }

    private fun decideSurvivalVote(user: UserInfo, accusedNickname: String): Boolean {
        val accusedUser = users.find { it.nickname == accusedNickname }
        
        return when {
            user.role == PlayerRole.LIAR && accusedUser?.role == PlayerRole.LIAR -> true
            user.role == PlayerRole.LIAR && accusedUser?.role == PlayerRole.CITIZEN -> false
            user.role == PlayerRole.CITIZEN && accusedUser?.role == PlayerRole.LIAR -> false
            else -> Random.nextBoolean()
        }
    }

    private fun setCurrentUser(nickname: String) {
        val user = users.find { it.nickname == nickname }
        if (user == null || user.userId == null) {
            println("[DEBUG_LOG] Warning: User $nickname not found or has no userId")
            return
        }
        
        val userPrincipal = org.example.kotlin_liargame.tools.security.UserPrincipal(
            userId = user.userId!!,
            nickname = nickname,
            authorities = emptyList(),
            providerId = "test"
        )
        
        val authentication = UsernamePasswordAuthenticationToken(userPrincipal, null, emptyList())
        SecurityContextHolder.getContext().authentication = authentication
    }
}
