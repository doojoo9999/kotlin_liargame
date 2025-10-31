package org.example.kotlin_liargame.domain.nemonemo.V1.repository

import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleReleaseEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface NemonemoPuzzleReleaseRepository : JpaRepository<NemonemoPuzzleReleaseEntity, Long> {
    fun findAllByReleasePackAndReleaseAtLessThanEqualOrderByReleaseAtDesc(
        releasePack: String,
        releaseAt: LocalDateTime
    ): List<NemonemoPuzzleReleaseEntity>

    fun findAllByReleasePack(releasePack: String): List<NemonemoPuzzleReleaseEntity>

    fun findFirstByPuzzleIdOrderByReleaseAtDesc(puzzleId: Long): NemonemoPuzzleReleaseEntity?
}
