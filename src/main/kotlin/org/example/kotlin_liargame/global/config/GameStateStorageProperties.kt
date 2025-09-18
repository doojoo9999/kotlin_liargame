package org.example.kotlin_liargame.global.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "game.state-storage")
data class GameStateStorageProperties(
    val strategy: StorageStrategy = StorageStrategy.REDIS,
    val hybridWriteThrough: Boolean = true
) {
    enum class StorageStrategy {
        REDIS,
        IN_MEMORY,
        HYBRID
    }

    fun useRedis(): Boolean = strategy == StorageStrategy.REDIS || strategy == StorageStrategy.HYBRID

    fun useInMemory(): Boolean = strategy == StorageStrategy.IN_MEMORY || strategy == StorageStrategy.HYBRID
}
