package org.example.kotlin_liargame.domain.game.dto.response

import java.time.Instant

data class LiarGuessStartResponse(
    val gameNumber: Int,
    val liarPlayer: PlayerResultInfo,
    val citizenSubject: String,
    val guessTimeLimit: Int = 30,
    val timestamp: Instant = Instant.now()
)