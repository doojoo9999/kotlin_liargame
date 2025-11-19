package org.example.kotlin_liargame.global.security

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

@Component
@ConfigurationProperties(prefix = "app.security.rate-limit")
data class RateLimitProperties(
    var enabled: Boolean = true,
    var api: ApiRateLimit = ApiRateLimit(),
    var websocket: WebsocketRateLimit = WebsocketRateLimit()
) {
    data class ApiRateLimit(
        var requestsPerMinute: Int = 120,
        var burstCapacity: Int = 150
    )

    data class WebsocketRateLimit(
        var messagesPerMinute: Int = 30,
        var burstCapacity: Int = 50,
        var handshakesPerMinute: Int = 15,
        var handshakeBurstCapacity: Int = 20
    )
}
