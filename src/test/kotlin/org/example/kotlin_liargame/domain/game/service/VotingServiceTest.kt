package org.example.kotlin_liargame.domain.game.service

import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import io.mockk.slot
import io.mockk.verify
import org.example.kotlin_liargame.domain.chat.service.ChatService
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.model.GameEntity
import org.example.kotlin_liargame.domain.game.model.PlayerEntity
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
import org.example.kotlin_liargame.domain.game.model.enum.GameState
import org.example.kotlin_liargame.domain.game.model.enum.PlayerRole
import org.example.kotlin_liargame.domain.game.model.enum.PlayerState
import org.example.kotlin_liargame.domain.game.repository.GameRepository
import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus
import org.example.kotlin_liargame.global.config.GameProperties
import org.example.kotlin_liargame.global.redis.GameStateService
import org.example.kotlin_liargame.global.session.SessionService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.TaskScheduler

class VotingServiceTest {

    private val gameRepository = mockk<GameRepository>()
    private val playerRepository = mockk<PlayerRepository>()
    private val messagingTemplate = mockk<SimpMessagingTemplate>(relaxed = true)
    private val taskScheduler = mockk<TaskScheduler>(relaxed = true)
    private val defenseService = mockk<DefenseService>(relaxed = true)
    private val gameMonitoringService = mockk<GameMonitoringService>(relaxed = true)
    private val gameResultService = mockk<GameResultService>(relaxed = true)
    private val gameProperties = GameProperties()
    private val gameProgressService = mockk<GameProgressService>(relaxed = true)
    private val sessionService = mockk<SessionService>()
    private val chatService = mockk<ChatService>()
    private val gameStateService = mockk<GameStateService>(relaxed = true)

    private val votingService = VotingService(
        gameRepository,
        playerRepository,
        messagingTemplate,
        taskScheduler,
        defenseService,
        gameMonitoringService,
        gameResultService,
        gameProperties,
        gameProgressService,
        sessionService,
        chatService,
        gameStateService
    )

    @Test
    fun `startVotingPhase broadcasts committed state and voting event`() {
        val game = GameEntity(
            gameNumber = 1,
            gameName = "Test Room",
            gamePassword = null,
            gameParticipants = 6,
            gameTotalRounds = 3,
            gameCurrentRound = 1,
            gameLiarCount = 1,
            gameMode = GameMode.LIARS_KNOW,
            gameState = GameState.IN_PROGRESS,
            currentPhase = GamePhase.SPEECH,
            gameOwner = "host"
        )
        game.turnOrder = "alice,bob"

        val subject = SubjectEntity(
            content = "topic",
            status = ContentStatus.APPROVED,
            word = emptyList()
        )

        val playerOne = PlayerEntity(
            game = game,
            userId = 1L,
            nickname = "alice",
            role = PlayerRole.CITIZEN,
            subject = subject,
            state = PlayerState.WAITING_FOR_HINT
        )
        val playerTwo = PlayerEntity(
            game = game,
            userId = 2L,
            nickname = "bob",
            role = PlayerRole.CITIZEN,
            subject = subject,
            state = PlayerState.WAITING_FOR_HINT
        )
        val players = listOf(playerOne, playerTwo)

        every { gameRepository.save(game) } returns game
        every { playerRepository.findByGameAndIsAlive(game, true) } returns players
        every { playerRepository.findByGame(game) } returns players
        every { playerRepository.saveAll(players) } returns players
        every { chatService.sendSystemMessage(any(), any()) } just runs
        every { chatService.isChatAvailable(any(), any()) } returns true
        every { sessionService.getOptionalUserId(any()) } returns null

        val stateSlot = slot<GameStateResponse>()
        every { gameMonitoringService.broadcastGameState(game, capture(stateSlot)) } just runs
        every { gameMonitoringService.notifyVotingStarted(any(), any(), any()) } just runs

        votingService.startVotingPhase(game)

        assertEquals(GamePhase.VOTING_FOR_LIAR, stateSlot.captured.currentPhase)
        assertNotNull(stateSlot.captured.phaseEndTime)
        verify {
            gameMonitoringService.notifyVotingStarted(
                game,
                match { candidates ->
                    candidates.map { it.userId } == players.map { it.userId }
                },
                gameProperties.votingTimeSeconds
            )
        }
    }
}
