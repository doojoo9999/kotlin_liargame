package org.example.kotlin_liargame.domain.nemonemo.repository

import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoLeaderboardEntryEntity
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoPuzzleReleaseEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NemonemoLeaderboardEntryRepository : JpaRepository<NemonemoLeaderboardEntryEntity, Long> {
    fun findFirstByReleaseAndUserIdOrderByScoreDesc(
        release: NemonemoPuzzleReleaseEntity,
        userId: Long
    ): NemonemoLeaderboardEntryEntity?
}
