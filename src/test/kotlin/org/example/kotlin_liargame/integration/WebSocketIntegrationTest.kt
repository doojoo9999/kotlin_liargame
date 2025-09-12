package org.example.kotlin_liargame.integration

import org.example.kotlin_liargame.domain.game.service.GameService
import org.example.kotlin_liargame.domain.user.service.UserService
import org.junit.jupiter.api.*
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.messaging.converter.MappingJackson2MessageConverter
import org.springframework.messaging.simp.stomp.*
import org.springframework.test.context.TestPropertySource
import org.springframework.web.socket.client.standard.StandardWebSocketClient
import java.util.concurrent.BlockingQueue
import java.util.concurrent.CountDownLatch
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = [
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
    "spring.jpa.hibernate.ddl-auto=create-drop"
])
class WebSocketIntegrationTest {

    @LocalServerPort
    private lateinit var port: String

    private lateinit var stompClient: StompSession
    private lateinit var gameService: GameService
    private lateinit var userService: UserService

    private val receivedMessages: BlockingQueue<String> = LinkedBlockingQueue()
    private val connectionLatch = CountDownLatch(1)
    private val messageLatch = CountDownLatch(1)

    @BeforeEach
    fun setup() {
        val url = "ws://localhost:$port/ws"
        val client = StandardWebSocketClient()
        val stompClient = StompClientSupport()
        stompClient.messageConverter = MappingJackson2MessageConverter()

        val sessionHandler = TestStompSessionHandler()
        this.stompClient = stompClient.connect(url, sessionHandler).get(10, TimeUnit.SECONDS)
        
        assertTrue(connectionLatch.await(10, TimeUnit.SECONDS), "Failed to connect to WebSocket")
    }

    @AfterEach
    fun cleanup() {
        if (::stompClient.isInitialized && stompClient.isConnected) {
            stompClient.disconnect()
        }
    }

    @Test
    fun `should connect to WebSocket successfully`() {
        assertTrue(stompClient.isConnected)
    }

    @Test
    fun `should subscribe to game channel and receive messages`() {
        val gameNumber = 12345
        val testMessage = """{"type":"GAME_STARTED","gameNumber":$gameNumber,"payload":{"message":"Game started"}}"""
        
        // Subscribe to game channel
        val subscription = stompClient.subscribe("/topic/game/$gameNumber") { message ->
            receivedMessages.offer(message.payload.toString())
            messageLatch.countDown()
        }

        // Send a test message to the game channel
        stompClient.send("/app/game/$gameNumber/message", testMessage)

        // Wait for message to be received
        assertTrue(messageLatch.await(5, TimeUnit.SECONDS), "Message not received within timeout")
        
        val receivedMessage = receivedMessages.poll()
        assertNotNull(receivedMessage)
        assertTrue(receivedMessage.contains("GAME_STARTED"))

        subscription.unsubscribe()
    }

    @Test
    fun `should handle chat messages through WebSocket`() {
        val gameNumber = 12345
        val chatMessage = """{"type":"CHAT","gameNumber":$gameNumber,"payload":{"message":"Hello, world!","playerId":"player1","playerName":"TestPlayer"}}"""
        val chatLatch = CountDownLatch(1)
        val receivedChatMessages: BlockingQueue<String> = LinkedBlockingQueue()
        
        // Subscribe to chat channel
        val subscription = stompClient.subscribe("/topic/game/$gameNumber/chat") { message ->
            receivedChatMessages.offer(message.payload.toString())
            chatLatch.countDown()
        }

        // Send chat message
        stompClient.send("/app/game/$gameNumber/chat", chatMessage)

        // Wait for chat message
        assertTrue(chatLatch.await(5, TimeUnit.SECONDS), "Chat message not received within timeout")
        
        val receivedMessage = receivedChatMessages.poll()
        assertNotNull(receivedMessage)
        assertTrue(receivedMessage.contains("Hello, world!"))

        subscription.unsubscribe()
    }

    @Test
    fun `should handle game state updates`() {
        val gameNumber = 12345
        val stateUpdate = """{"type":"GAME_STATE_UPDATED","gameNumber":$gameNumber,"payload":{"state":"IN_PROGRESS","timeRemaining":120}}"""
        val stateLatch = CountDownLatch(1)
        val receivedStateMessages: BlockingQueue<String> = LinkedBlockingQueue()
        
        // Subscribe to state channel
        val subscription = stompClient.subscribe("/topic/game/$gameNumber/state") { message ->
            receivedStateMessages.offer(message.payload.toString())
            stateLatch.countDown()
        }

        // Send state update
        stompClient.send("/app/game/$gameNumber/state", stateUpdate)

        // Wait for state update
        assertTrue(stateLatch.await(5, TimeUnit.SECONDS), "State update not received within timeout")
        
        val receivedMessage = receivedStateMessages.poll()
        assertNotNull(receivedMessage)
        assertTrue(receivedMessage.contains("IN_PROGRESS"))

        subscription.unsubscribe()
    }

    @Test
    fun `should handle player actions through WebSocket`() {
        val gameNumber = 12345
        val playerAction = """{"type":"HINT","gameNumber":$gameNumber,"payload":{"hint":"It's something blue","playerId":"player1"}}"""
        val actionLatch = CountDownLatch(1)
        val receivedActionMessages: BlockingQueue<String> = LinkedBlockingQueue()
        
        // Subscribe to events channel
        val subscription = stompClient.subscribe("/topic/game/$gameNumber/events") { message ->
            receivedActionMessages.offer(message.payload.toString())
            actionLatch.countDown()
        }

        // Send player action
        stompClient.send("/app/game/$gameNumber/hint", playerAction)

        // Wait for action confirmation
        assertTrue(actionLatch.await(5, TimeUnit.SECONDS), "Player action not received within timeout")
        
        val receivedMessage = receivedActionMessages.poll()
        assertNotNull(receivedMessage)
        assertTrue(receivedMessage.contains("HINT"))

        subscription.unsubscribe()
    }

    @Test
    fun `should handle user-specific messages`() {
        val userId = 1L
        val userMessage = """{"type":"NOTIFICATION","userId":$userId,"payload":{"message":"You have been invited to a game"}}"""
        val userLatch = CountDownLatch(1)
        val receivedUserMessages: BlockingQueue<String> = LinkedBlockingQueue()
        
        // Subscribe to user-specific channel
        val subscription = stompClient.subscribe("/user/$userId/queue/messages") { message ->
            receivedUserMessages.offer(message.payload.toString())
            userLatch.countDown()
        }

        // Send user-specific message
        stompClient.send("/app/user/$userId/message", userMessage)

        // Wait for user message
        assertTrue(userLatch.await(5, TimeUnit.SECONDS), "User message not received within timeout")
        
        val receivedMessage = receivedUserMessages.poll()
        assertNotNull(receivedMessage)
        assertTrue(receivedMessage.contains("NOTIFICATION"))

        subscription.unsubscribe()
    }

    @Test
    fun `should handle multiple concurrent connections`() {
        val numConnections = 5
        val connections = mutableListOf<StompSession>()
        val connectionLatches = mutableListOf<CountDownLatch>()

        try {
            // Create multiple connections
            repeat(numConnections) { index ->
                val url = "ws://localhost:$port/ws"
                val client = StandardWebSocketClient()
                val stompClientSupport = StompClientSupport()
                stompClientSupport.messageConverter = MappingJackson2MessageConverter()

                val latch = CountDownLatch(1)
                connectionLatches.add(latch)

                val sessionHandler = object : StompSessionHandlerAdapter() {
                    override fun afterConnected(session: StompSession, connectedHeaders: StompHeaders) {
                        latch.countDown()
                    }
                }

                val session = stompClientSupport.connect(url, sessionHandler).get(10, TimeUnit.SECONDS)
                connections.add(session)
            }

            // Verify all connections are established
            connectionLatches.forEach { latch ->
                assertTrue(latch.await(10, TimeUnit.SECONDS), "Connection not established within timeout")
            }

            // Verify all connections are active
            connections.forEach { session ->
                assertTrue(session.isConnected)
            }

        } finally {
            // Clean up connections
            connections.forEach { session ->
                if (session.isConnected) {
                    session.disconnect()
                }
            }
        }
    }

    @Test
    fun `should handle connection errors gracefully`() {
        // Disconnect current session
        stompClient.disconnect()
        
        // Wait for disconnection
        Thread.sleep(1000)
        
        // Verify connection is closed
        assertFalse(stompClient.isConnected)
        
        // Attempt to reconnect
        val url = "ws://localhost:$port/ws"
        val client = StandardWebSocketClient()
        val stompClientSupport = StompClientSupport()
        stompClientSupport.messageConverter = MappingJackson2MessageConverter()

        val reconnectLatch = CountDownLatch(1)
        val sessionHandler = object : StompSessionHandlerAdapter() {
            override fun afterConnected(session: StompSession, connectedHeaders: StompHeaders) {
                reconnectLatch.countDown()
            }
        }

        val newSession = stompClientSupport.connect(url, sessionHandler).get(10, TimeUnit.SECONDS)
        assertTrue(reconnectLatch.await(10, TimeUnit.SECONDS), "Reconnection failed")
        assertTrue(newSession.isConnected)
        
        // Clean up
        newSession.disconnect()
    }

    @Test
    fun `should handle heartbeat messages`() {
        val heartbeatLatch = CountDownLatch(1)
        
        // Send heartbeat message
        val heartbeat = """{"timestamp":${System.currentTimeMillis()},"userId":1,"sessionId":"test-session"}"""
        
        // In a real scenario, heartbeat responses would be handled by the framework
        // Here we're just testing that the connection remains stable
        stompClient.send("/app/heartbeat", heartbeat)
        
        // Wait a bit and verify connection is still active
        Thread.sleep(2000)
        assertTrue(stompClient.isConnected)
    }

    inner class TestStompSessionHandler : StompSessionHandlerAdapter() {
        override fun afterConnected(session: StompSession, connectedHeaders: StompHeaders) {
            connectionLatch.countDown()
        }

        override fun handleException(session: StompSession, command: StompCommand?, headers: StompHeaders, payload: ByteArray, exception: Throwable) {
            exception.printStackTrace()
        }

        override fun handleTransportError(session: StompSession, exception: Throwable) {
            exception.printStackTrace()
        }
    }
}

class StompClientSupport : StompClient {
    private val stompClient = org.springframework.messaging.simp.stomp.StompClient(StandardWebSocketClient())
    
    var messageConverter: MappingJackson2MessageConverter
        get() = stompClient.messageConverter as MappingJackson2MessageConverter
        set(value) { stompClient.messageConverter = value }

    fun connect(url: String, sessionHandler: StompSessionHandler): java.util.concurrent.CompletableFuture<StompSession> {
        return stompClient.connect(url, sessionHandler)
    }
}