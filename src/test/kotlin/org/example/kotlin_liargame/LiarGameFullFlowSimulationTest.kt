package org.example.kotlin_liargame

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
import org.example.kotlin_liargame.domain.game.dto.request.*
import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
import org.example.kotlin_liargame.domain.game.dto.response.PlayerResponse
import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
import org.example.kotlin_liargame.domain.user.repository.UserRepository
import org.example.kotlin_liargame.domain.user.service.UserService
import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.http.MediaType
import org.springframework.messaging.simp.stomp.StompSession
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter
import org.springframework.mock.web.MockHttpSession
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultHandlers.print
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.socket.client.standard.StandardWebSocketClient
import org.springframework.web.socket.messaging.WebSocketStompClient
import java.lang.reflect.Type
import java.util.concurrent.BlockingQueue
import java.util.concurrent.LinkedBlockingDeque
import java.util.concurrent.TimeUnit

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LiarGameFullFlowSimulationTest {

    @LocalServerPort
    private var port: Int = 0

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var userService: UserService

    @Autowired
    private lateinit var userRepository: UserRepository

    private val players = mutableMapOf<String, MockHttpSession>()
    private var gameNumber: Int = 0
    private val subjectName = "음식"
    private val wordName = "짜장면"

    private lateinit var stompClient: WebSocketStompClient
    private lateinit var stompSession: StompSession
    private lateinit var receivedMessages: BlockingQueue<GameStateResponse>

    @BeforeEach
    fun setUp() {
        userRepository.deleteAll()

        userService.createUser(UserAddRequest("admin", "password"))
        (1..4).forEach {
            userService.createUser(UserAddRequest("Player$it", "password"))
        }

        val adminSession = loginAndGetSession("admin", "password")
        val subjectId = createSubject(adminSession, subjectName)
        createWord(adminSession, subjectName, wordName)

        players["Player1"] = loginAndGetSession("Player1", "password")
        players["Player2"] = loginAndGetSession("Player2", "password")
        players["Player3"] = loginAndGetSession("Player3", "password")
        players["Player4"] = loginAndGetSession("Player4", "password")

        gameNumber = createRoom(players["Player1"]!!, "테스트 방", listOf(subjectId))

        joinRoom(players["Player1"]!!, gameNumber)
        joinRoom(players["Player2"]!!, gameNumber)
        joinRoom(players["Player3"]!!, gameNumber)
        joinRoom(players["Player4"]!!, gameNumber)
    }

    @Test
    fun `시민 승리 시나리오`() {
        val initialGameState = startGame(players["Player1"]!!)
        val (liar, citizens) = findLiarAndCitizens(initialGameState)

        initialGameState.turnOrder!!.forEach { nickname -> giveHint(players[nickname]!!, "힌트") }
        
        var lastState: GameStateResponse? = null
        citizens.forEach { citizen -> lastState = vote(players[citizen.nickname]!!, liar.id) }
        lastState = vote(players[liar.nickname]!!, citizens.first().id)

        val accusedPlayer = lastState!!.accusedPlayer!!
        assertEquals(liar.nickname, accusedPlayer.nickname)

        submitDefense(players[accusedPlayer.nickname]!!, "저는 라이어가 아닙니다.")
        players.values.forEach { session -> finalVote(session, true) }

        guessWord(players[liar.nickname]!!, "다른단어")

        val finalState = getGameState(players["Player1"]!!)
        assertEquals("ENDED", finalState.gameState)
        assertEquals("CITIZEN", finalState.winner)

        players.values.forEach { session ->
            leaveRoom(session)
            logout(session)
        }
    }

    @Test
    fun `라이어 승리 시나리오`() {
        val initialGameState = startGame(players["Player1"]!!)
        val (_, citizens) = findLiarAndCitizens(initialGameState)

        initialGameState.turnOrder!!.forEach { nickname -> giveHint(players[nickname]!!, "힌트") }
        val innocentCitizen = citizens.first()
        
        var lastState: GameStateResponse? = null
        players.forEach { (_, session) -> lastState = vote(session, innocentCitizen.id) }

        val accusedPlayer = lastState!!.accusedPlayer!!
        assertEquals(innocentCitizen.nickname, accusedPlayer.nickname)

        submitDefense(players[accusedPlayer.nickname]!!, "저는 시민입니다.")
        players.values.forEach { session -> finalVote(session, true) }

        val finalState = getGameState(players["Player1"]!!)
        assertEquals("ENDED", finalState.gameState)
        assertEquals("LIAR", finalState.winner)

        players.values.forEach { session ->
            leaveRoom(session)
            logout(session)
        }
    }

    @Test
    fun `STOMP 메시지 브로드캐스트 테스트`() {
        receivedMessages = LinkedBlockingDeque()
        stompClient = WebSocketStompClient(StandardWebSocketClient())
        stompSession = stompClient.connect("ws://localhost:$port/ws", object : StompSessionHandlerAdapter() {}).get(1, TimeUnit.SECONDS)
        stompSession.subscribe("/topic/game/$gameNumber/game-state", object : StompSessionHandlerAdapter() {
            override fun getPayloadType(headers: org.springframework.messaging.simp.stomp.StompHeaders): Type {
                return GameStateResponse::class.java
            }

            override fun handleFrame(headers: org.springframework.messaging.simp.stomp.StompHeaders, payload: Any?) {
                receivedMessages.add(payload as GameStateResponse)
            }
        })

        startGame(players["Player1"]!!)

        val receivedMessage = receivedMessages.poll(5, TimeUnit.SECONDS)
        assertNotNull(receivedMessage)
        assertEquals("IN_PROGRESS", receivedMessage.gameState)
    }

    private fun findLiarAndCitizens(gameState: GameStateResponse): Pair<PlayerResponse, List<PlayerResponse>> {
        val playerRoles = gameState.players.associate { player ->
            val playerSpecificState = getGameState(players[player.nickname]!!)
            player.nickname to playerSpecificState.yourRole!!
        }

        val liarNickname = playerRoles.entries.find { it.value == "LIAR" }!!.key
        val liar = gameState.players.find { it.nickname == liarNickname }!!
        val citizens = gameState.players.filter { it.nickname != liarNickname }
        return Pair(liar, citizens)
    }

    private fun loginAndGetSession(nickname: String, password: String): MockHttpSession {
        val session = MockHttpSession()
        mockMvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(LoginRequest(nickname, password)))
            .session(session))
            .andExpect(status().isOk)
        return session
    }

    private fun createSubject(session: MockHttpSession, subjectName: String): Long {
        val result = mockMvc.perform(post("/api/v1/subjects/applysubj")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(SubjectRequest(subjectName)))
            .session(session))
            .andExpect(status().isOk)
            .andReturn()
        val responseBody = objectMapper.readTree(result.response.contentAsString)
        return responseBody.get("id").asLong()
    }

    private fun createWord(session: MockHttpSession, subjectName: String, wordName: String) {
        mockMvc.perform(post("/api/v1/words/applyw")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(ApplyWordRequest(subjectName, wordName)))
            .session(session))
            .andExpect(status().isOk)
    }

    private fun createRoom(session: MockHttpSession, roomName: String, subjectIds: List<Long>): Int {
        val request = CreateGameRoomRequest(gameName = roomName, gameParticipants = 4, subjectIds = subjectIds, useRandomSubjects = false)
        val result = mockMvc.perform(post("/api/v1/game/create")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request))
            .session(session))
            .andExpect(status().isOk)
            .andReturn()
        return result.response.contentAsString.toInt()
    }

    private fun joinRoom(session: MockHttpSession, gameNumber: Int) {
        mockMvc.perform(post("/api/v1/game/join")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(JoinGameRequest(gameNumber)))
            .session(session))
            .andExpect(status().isOk)
    }

    private fun startGame(session: MockHttpSession): GameStateResponse {
        val result = mockMvc.perform(post("/api/v1/game/start").session(session))
            .andExpect(status().isOk)
            .andReturn()
        return objectMapper.readValue(result.response.contentAsString)
    }

    private fun getGameState(session: MockHttpSession): GameStateResponse {
        val result = mockMvc.perform(get("/api/v1/game/$gameNumber").session(session))
            .andExpect(status().isOk)
            .andReturn()
        return objectMapper.readValue(result.response.contentAsString)
    }

    private fun giveHint(session: MockHttpSession, hint: String) {
        mockMvc.perform(post("/api/v1/game/hint")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(GiveHintRequest(gameNumber, hint)))
            .session(session))
            .andExpect(status().isOk)
    }

    private fun vote(session: MockHttpSession, targetPlayerId: Long): GameStateResponse {
        val result = mockMvc.perform(post("/api/v1/game/vote")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(VoteRequest(gameNumber, targetPlayerId)))
            .session(session))
            .andDo(print())
            .andExpect(status().isOk)
            .andReturn()
        return objectMapper.readValue(result.response.contentAsString)
    }

    private fun submitDefense(session: MockHttpSession, defense: String) {
        mockMvc.perform(post("/api/v1/game/submit-defense")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(SubmitDefenseRequest(gameNumber, defense)))
            .session(session))
            .andExpect(status().isOk)
    }

    private fun finalVote(session: MockHttpSession, voteForExecution: Boolean) {
        mockMvc.perform(post("/api/v1/game/vote/final")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(FinalVotingRequest(gameNumber, voteForExecution)))
            .session(session))
            .andExpect(status().isOk)
    }

    private fun guessWord(session: MockHttpSession, guess: String) {
        mockMvc.perform(post("/api/v1/game/guess-word")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(GuessWordRequest(gameNumber, guess)))
            .session(session))
            .andExpect(status().isOk)
    }

    private fun leaveRoom(session: MockHttpSession) {
        mockMvc.perform(post("/api/v1/game/leave")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(LeaveGameRequest(gameNumber)))
            .session(session))
            .andExpect(status().isOk)
    }

    private fun logout(session: MockHttpSession) {
        mockMvc.perform(post("/api/v1/auth/logout").session(session))
            .andExpect(status().isOk)
    }
}
