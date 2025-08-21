package org.example.kotlin_liargame.global.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "game.properties")
data class GameProperties(
    val turnTimeoutSeconds: Long = 60L,
    val minPlayers: Int = 3,
    val maxPlayers: Int = 15
)
