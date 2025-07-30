package org.example.kotlin_liargame.tools.security.jwt

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

@ConfigurationProperties(prefix = "security.jwt")
@Component
data class JwtProperties(
    var isTestUser: Boolean = false
)
