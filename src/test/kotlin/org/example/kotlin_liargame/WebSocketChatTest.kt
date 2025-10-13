//package org.example.kotlin_liargame
//
//import org.example.kotlin_liargame.domain.chat.dto.request.SendChatMessageRequest
//import org.example.kotlin_liargame.domain.chat.dto.response.ChatMessageResponse
//import org.example.kotlin_liargame.domain.chat.repository.ChatMessageRepository
//import org.example.kotlin_liargame.domain.game.dto.request.CreateGameRoomRequest
//import org.example.kotlin_liargame.domain.game.model.enum.GameMode
//import org.example.kotlin_liargame.domain.game.repository.GameRepository
//import org.example.kotlin_liargame.domain.game.service.GameService
//import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
//import org.example.kotlin_liargame.domain.user.repository.UserRepository
//import org.example.kotlin_liargame.domain.user.service.UserService
//import org.example.kotlin_liargame.tools.security.UserPrincipal
//import org.junit.jupiter.api.AfterEach
//import org.junit.jupiter.api.Assertions.*
//import org.junit.jupiter.api.BeforeEach
//import org.junit.jupiter.api.Test
//import org.springframework.beans.factory.annotation.Autowired
//import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
//import org.springframework.boot.test.context.SpringBootTest
//import org.springframework.messaging.converter.MappingJackson2MessageConverter
//import org.springframework.messaging.simp.stomp.*
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
//import org.springframework.security.core.context.SecurityContextHolder
//import org.springframework.transaction.annotation.Transactional
//import org.springframework.web.socket.client.standard.StandardWebSocketClient
//import org.springframework.web.socket.messaging.WebSocketStompClient
//import org.springframework.web.socket.sockjs.client.SockJsClient
//import org.springframework.web.socket.sockjs.client.Transport
//import org.springframework.web.socket.sockjs.client.WebSocketTransport
//import java.lang.reflect.Type
//import java.util.concurrent.CompletableFuture
//import java.util.concurrent.TimeUnit
//
//
//
//@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, properties = ["server.port=20022"])
//@ConditionalOnProperty(name = ["spring.security.jwt.test-mode"], havingValue = "false", matchIfMissing = true)
//@Transactional
//class WebSocketChatTest {
//
//    private val port: Int = 20022
//
//    @Autowired
//    private lateinit var userService: UserService
//
//    @Autowired
//    private lateinit var gameService: GameService
//
//    @Autowired
//    private lateinit var userRepository: UserRepository
//
//    @Autowired
//    private lateinit var gameRepository: GameRepository
//
//    @Autowired
//    private lateinit var chatMessageRepository: ChatMessageRepository
//
//    private lateinit var stompClient: WebSocketStompClient
//    private lateinit var stompSession: StompSession
//
//    private var gameNumber: Int = 0
//    private val users = mutableListOf<UserInfo>()
//
//    data class UserInfo(
//        val nickname: String,
//        val profileImgUrl: String,
//        var userId: Long? = null,
//        var playerId: Long? = null
//    )
//
//    @BeforeEach
//    fun setup() {
//
//        val nickname = "test"
//        val profileImgUrl = "https://example.com/profile.png"
//        users.add(UserInfo(nickname, profileImgUrl))
//
//        try {
//            userService.createUser(UserAddRequest(nickname, profileImgUrl))
//            val userEntity = userRepository.findByNickname(nickname)
//            if (userEntity != null) {
//                users.last().userId = userEntity.id
//                println("[DEBUG_LOG] Created user: $nickname with ID: ${userEntity.id}")
//            }
//        } catch (e: Exception) {
//            println("[DEBUG_LOG] Failed to create user $nickname: ${e.message}")
//        }
//
//
//        val user = users[0]
//        setCurrentUser(user.nickname)
//
//        val createGameRequest = CreateGameRoomRequest(
//            nickname = user.nickname,
//            gName = "WebSocket Test Game",
//            gPassword = null,
//            gParticipants = 5,
//            gTotalRounds = 3,
//            gLiarCount = 1,
//            gGameMode = GameMode.LIARS_KNOW
//        )
//
//        gameNumber = gameService.createGameRoom(createGameRequest)
//        println("[DEBUG_LOG] Created game room: $gameNumber")
//
//
//        val webSocketClient = StandardWebSocketClient()
//        val transports: List<Transport> = listOf(WebSocketTransport(webSocketClient))
//        val sockJsClient = SockJsClient(transports)
//
//        stompClient = WebSocketStompClient(sockJsClient)
//        stompClient.messageConverter = MappingJackson2MessageConverter()
//
//        val url = "ws://218.150.3.77:${port}/ws"
//        println("[DEBUG_LOG] Connecting to WebSocket at $url")
//
//        val sessionFuture = CompletableFuture<StompSession>()
//
//        val sessionHandler = object : StompSessionHandlerAdapter() {
//            override fun afterConnected(session: StompSession, connectedHeaders: StompHeaders) {
//                println("[DEBUG_LOG] Connected to WebSocket")
//                sessionFuture.complete(session)
//            }
//
//            override fun handleException(session: StompSession, command: StompCommand?, headers: StompHeaders, payload: ByteArray, exception: Throwable) {
//                println("[DEBUG_LOG] WebSocket exception: ${exception.message}")
//                sessionFuture.completeExceptionally(exception)
//            }
//        }
//        stompClient.connectAsync(url, sessionHandler)
//
//        stompSession = sessionFuture.get(10, TimeUnit.SECONDS)
//    }
//
//    @AfterEach
//    fun cleanup() {
//        if (::stompSession.isInitialized && stompSession.isConnected) {
//            stompSession.disconnect()
//        }
//    }
//
//    @Test
//    fun `test WebSocket connection and message exchange`() {
//
//        val messageFuture = CompletableFuture<ChatMessageResponse>()
//
//        stompSession.subscribe("/topic/chat.${gameNumber}", object : StompFrameHandler {
//            override fun getPayloadType(headers: StompHeaders): Type {
//                return ChatMessageResponse::class.java
//            }
//
//            override fun handleFrame(headers: StompHeaders, payload: Any?) {
//                println("[DEBUG_LOG] Received message: $payload")
//                messageFuture.complete(payload as ChatMessageResponse)
//            }
//        })
//
//
//        setCurrentUser("test")
//        val chatMessage = SendChatMessageRequest(
//            gNumber = gameNumber,
//            content = "Hello via WebSocket!"
//        )
//
//        stompSession.send("/app/chat.send", chatMessage)
//        println("[DEBUG_LOG] Sent message via WebSocket")
//
//
//        val receivedMessage = messageFuture.get(10, TimeUnit.SECONDS)
//
//
//        assertNotNull(receivedMessage)
//        assertEquals("Hello via WebSocket!", receivedMessage.content)
//        assertEquals("test", receivedMessage.playerNickname)
//    }
//
//    @Test
//    fun `test sending message via REST and receiving via WebSocket`() {
//
//        val messageFuture = CompletableFuture<ChatMessageResponse>()
//
//        stompSession.subscribe("/topic/chat.${gameNumber}", object : StompFrameHandler {
//            override fun getPayloadType(headers: StompHeaders): Type {
//                return ChatMessageResponse::class.java
//            }
//
//            override fun handleFrame(headers: StompHeaders, payload: Any?) {
//                println("[DEBUG_LOG] Received message: $payload")
//                messageFuture.complete(payload as ChatMessageResponse)
//            }
//        })
//
//
//        setCurrentUser("test")
//        val chatMessage = SendChatMessageRequest(
//            gNumber = gameNumber,
//            content = "Hello via REST API!"
//        )
//
//        val restTemplate = org.springframework.boot.test.web.client.TestRestTemplate()
//        val url = "http://218.150.3.77:${port}/api/v1/chat/send"
//
//
//        val headers = org.springframework.http.HttpHeaders()
//        headers.set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwibmlja25hbWUiOiJ0ZXN0IiwiaWF0IjoxNzUzODQ5OTg5LCJleHAiOjE3NTM4NTM1ODl9.2-YEF7mAKRfJI3inj8kI1vGXfHzbSavoycBSQtQKnvA")
//
//        val requestEntity = org.springframework.http.HttpEntity(chatMessage, headers)
//        restTemplate.postForEntity(url, requestEntity, ChatMessageResponse::class.java)
//
//        println("[DEBUG_LOG] Sent message via REST API")
//
//
//        val receivedMessage = messageFuture.get(10, TimeUnit.SECONDS)
//
//
//        assertNotNull(receivedMessage)
//        assertEquals("Hello via REST API!", receivedMessage.content)
//        assertEquals("test", receivedMessage.playerNickname)
//    }
//
//    @Test
//    fun `test chat history retrieval`() {
//
//        setCurrentUser("test")
//        val message1 = SendChatMessageRequest(gameNumber, "Message 1")
//        val message2 = SendChatMessageRequest(gameNumber, "Message 2")
//
//        stompSession.send("/app/chat.send", message1)
//        stompSession.send("/app/chat.send", message2)
//
//
//        Thread.sleep(1000)
//
//
//        val restTemplate = org.springframework.boot.test.web.client.TestRestTemplate()
//        val url = "http://218.150.3.77:${port}/api/v1/chat/${gameNumber}"
//
//
//        val headers = org.springframework.http.HttpHeaders()
//        headers.set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwibmlja25hbWUiOiJ0ZXN0IiwiaWF0IjoxNzUzODQ5OTg5LCJleHAiOjE3NTM4NTM1ODl9.2-YEF7mAKRfJI3inj8kI1vGXfHzbSavoycBSQtQKnvA")
//
//        val requestEntity = org.springframework.http.HttpEntity<Void>(headers)
//        val response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, requestEntity,
//            Array<ChatMessageResponse>::class.java)
//
//
//        assertNotNull(response.body)
//        assertTrue(response.body!!.size >= 2)
//
//
//        val messages = response.body!!.toList()
//        assertTrue(messages.any { it.content == "Message 1" })
//        assertTrue(messages.any { it.content == "Message 2" })
//    }
//
//    private fun setCurrentUser(nickname: String) {
//
//
//
//        val userPrincipal = UserPrincipal(
//            userId = 1L,
//            nickname = "test",
//            authorities = emptyList(),
//            providerId = "test"
//        )
//
//
//        val authentication = UsernamePasswordAuthenticationToken(userPrincipal, null, emptyList())
//        SecurityContextHolder.getContext().authentication = authentication
//
//        println("[DEBUG_LOG] Set test user with fixed JWT token")
//    }
//}