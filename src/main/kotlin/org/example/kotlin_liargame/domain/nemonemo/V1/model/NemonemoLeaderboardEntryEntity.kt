package org.example.kotlin_liargame.domain.nemonemo.V1.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "nemonemo_leaderboard_entry")
class NemonemoLeaderboardEntryEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "release_id", nullable = false)
    val release: NemonemoPuzzleReleaseEntity,

    @Column(name = "user_id", nullable = false)
    val userId: Long,

    @Column(nullable = false)
    var rank: Int,

    @Column(nullable = false)
    var score: Int,

    @Column(name = "duration_seconds", nullable = false)
    var durationSeconds: Int,

    @Column(nullable = false)
    var accuracy: Double
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
