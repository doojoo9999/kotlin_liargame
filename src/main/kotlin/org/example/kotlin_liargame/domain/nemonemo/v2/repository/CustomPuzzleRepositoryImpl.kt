package org.example.kotlin_liargame.domain.nemonemo.v2.repository

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
class CustomPuzzleRepositoryImpl : CustomPuzzleRepository {

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    override fun incrementPlayStats(puzzleId: UUID, clear: Boolean) {
        val clearIncrement = if (clear) 1 else 0
        entityManager.createQuery(
            "update PuzzleEntity p set p.playCount = p.playCount + 1, p.clearCount = p.clearCount + :clearIncrement where p.id = :id"
        )
            .setParameter("clearIncrement", clearIncrement)
            .setParameter("id", puzzleId)
            .executeUpdate()
    }
}
