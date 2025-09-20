package org.example.kotlin_liargame.domain.game.dto.response

import org.example.kotlin_liargame.domain.game.dto.GameRealtimePayload
import java.time.Instant

data class ModeratorMessage(
    val type: String = "MODERATOR",
    val content: String,
    val timestamp: Instant,
    val isImportant: Boolean = true
) : GameRealtimePayload
