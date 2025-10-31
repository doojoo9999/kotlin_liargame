package org.example.kotlin_liargame.domain.nemonemo.V1.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.example.kotlin_liargame.global.base.BaseEntity
import java.time.LocalDateTime

@Entity
@Table(name = "nemonemo_session")
class NemonemoSessionEntity(
    @Column(name = "user_id", nullable = false)
    val userId: Long,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    val puzzle: NemonemoPuzzleEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "release_id")
    val release: NemonemoPuzzleReleaseEntity? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: PuzzleSessionStatus = PuzzleSessionStatus.IN_PROGRESS,

    @Column(name = "started_at", nullable = false)
    val startedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null,

    @Column(name = "mistake_count", nullable = false)
    var mistakeCount: Int = 0,

    @Column(name = "hint_used", nullable = false)
    var hintUsed: Int = 0,

    @Column(name = "final_score")
    var finalScore: Int? = null,

    @Column(name = "duration_seconds")
    var durationSeconds: Int? = null,

    @Column(name = "client_version", length = 40)
    var clientVersion: String? = null
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
