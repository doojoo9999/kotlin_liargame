package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class GameEndResponse(
    val gameNumber: Int,
    val winner: String, // "LIARS" or "CITIZENS"  
    val citizens: List<PlayerResultInfo>,
    val liars: List<PlayerResultInfo>,
    val citizenSubject: String?,
    val liarSubject: String?,
    val gameStatistics: GameStatistics,
    val timestamp: Instant = Instant.now()
)