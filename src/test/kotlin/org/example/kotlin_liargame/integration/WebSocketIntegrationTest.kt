package org.example.kotlin_liargame.integration

import org.example.kotlin_liargame.tools.websocket.WebSocketConfig
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.messaging.support.ExecutorSubscribableChannel
import org.springframework.test.context.ActiveProfiles

@SpringBootTest
@ActiveProfiles("test")
class WebSocketIntegrationTest @Autowired constructor(
    private val applicationContext: ApplicationContext,
    private val webSocketConfig: WebSocketConfig,
    private val messagingTemplate: SimpMessagingTemplate
) {

    @Test
    fun `websocket configuration bean is registered`() {
        assertTrue(applicationContext.containsBean("webSocketConfig"))
    }

    @Test
    fun `message broker exposes expected prefixes`() {
        val registry = CapturingMessageBrokerRegistry()
        webSocketConfig.configureMessageBroker(registry)

        assertTrue(registry.applicationPrefixes.contains("/app"))
        assertTrue(registry.simpleBrokerPrefixes.contains("/topic"))
    }

    @Test
    fun `simp messaging template is available`() {
        assertNotNull(messagingTemplate.messageConverter)
    }

    private class CapturingMessageBrokerRegistry : MessageBrokerRegistry(
        ExecutorSubscribableChannel(),
        ExecutorSubscribableChannel()
    ) {
        var applicationPrefixes: List<String> = emptyList()
            private set

        var simpleBrokerPrefixes: List<String> = emptyList()
            private set

        override fun setApplicationDestinationPrefixes(vararg prefixes: String): MessageBrokerRegistry {
            applicationPrefixes = prefixes.toList()
            return super.setApplicationDestinationPrefixes(*prefixes)
        }

        override fun enableSimpleBroker(vararg destinationPrefixes: String) = super.enableSimpleBroker(*destinationPrefixes).also {
            simpleBrokerPrefixes = destinationPrefixes.toList()
        }
    }
}
