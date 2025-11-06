package org.example.kotlin_liargame.domain.nemonemo.v2.repository

import java.util.UUID

interface CustomPuzzleRepository {
    fun incrementPlayStats(puzzleId: UUID, clear: Boolean)
}
