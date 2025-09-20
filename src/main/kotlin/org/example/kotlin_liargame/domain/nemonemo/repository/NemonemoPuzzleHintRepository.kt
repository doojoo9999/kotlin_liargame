package org.example.kotlin_liargame.domain.nemonemo.repository

import org.example.kotlin_liargame.domain.nemonemo.model.HintAxis
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleEntity
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleHintEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NemonemoPuzzleHintRepository : JpaRepository<NemonemoPuzzleHintEntity, Long> {
    fun deleteAllByPuzzle(puzzle: NemonemoPuzzleEntity)
    fun findAllByPuzzleAndAxisOrderByPositionIndexAsc(
        puzzle: NemonemoPuzzleEntity,
        axis: HintAxis
    ): List<NemonemoPuzzleHintEntity>
}
