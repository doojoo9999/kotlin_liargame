package org.example.kotlin_liargame.domain.nemonemo.V1.repository

import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoSessionEntity
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleSessionStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NemonemoSessionRepository : JpaRepository<NemonemoSessionEntity, Long> {
    fun findFirstByUserIdAndPuzzle_IdAndStatusOrderByCreatedAtDesc(
        userId: Long,
        puzzleId: Long,
        status: PuzzleSessionStatus
    ): NemonemoSessionEntity?
}
