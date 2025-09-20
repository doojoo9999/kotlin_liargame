package org.example.kotlin_liargame.domain.nemonemo.repository

import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleDifficulty
import org.example.kotlin_liargame.domain.nemonemo.model.PuzzleLifecycleStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NemonemoPuzzleRepository : JpaRepository<NemonemoPuzzleEntity, Long> {
    fun findByCode(code: String): NemonemoPuzzleEntity?

    fun findAllByDifficulty(difficulty: PuzzleDifficulty, pageable: Pageable): Page<NemonemoPuzzleEntity>

    fun findAllByStatus(status: PuzzleLifecycleStatus, pageable: Pageable): Page<NemonemoPuzzleEntity>

    fun findAllByStatusAndDifficulty(
        status: PuzzleLifecycleStatus,
        difficulty: PuzzleDifficulty,
        pageable: Pageable
    ): Page<NemonemoPuzzleEntity>
}
