package org.example.kotlin_liargame.domain.nemonemo.v2.model

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
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
import jakarta.persistence.UniqueConstraint
import org.example.kotlin_liargame.global.base.BaseEntity
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.io.Serializable
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "plays")
class PlayEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    val puzzle: PuzzleEntity,

    @Column(name = "subject_key", nullable = false, columnDefinition = "uuid")
    val subjectKey: UUID,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    val mode: PuzzleMode = PuzzleMode.NORMAL,

    @Column(name = "started_at", nullable = false)
    val startedAt: Instant,

    @Column(name = "finished_at")
    var finishedAt: Instant? = null,

    @Column(name = "client_build", length = 32)
    var clientBuild: String? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_events", columnDefinition = "jsonb")
    var inputEvents: String,

    @Column(nullable = false)
    var mistakes: Int = 0,

    @Column(name = "used_hints", nullable = false)
    var usedHints: Int = 0,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "progress_snapshots", columnDefinition = "jsonb")
    var progressSnapshots: String? = null,

    @Column(name = "undo_count", nullable = false)
    var undoCount: Int = 0,

    @Column(name = "combo_count", nullable = false)
    var comboCount: Int = 0
) : BaseEntity() {

    @Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID()
}

@Embeddable
data class ScoreId(
    @Column(name = "puzzle_id", columnDefinition = "uuid")
    val puzzleId: UUID,

    @Column(name = "subject_key", columnDefinition = "uuid")
    val subjectKey: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", length = 16)
    val mode: PuzzleMode = PuzzleMode.NORMAL
) : Serializable

@Entity
@Table(name = "scores")
class ScoreEntity(
    @EmbeddedId
    val id: ScoreId,

    @Column(name = "best_time_ms")
    var bestTimeMs: Long? = null,

    @Column(name = "best_score")
    var bestScore: Int? = null,

    @Column(name = "perfect_clear", nullable = false)
    var perfectClear: Boolean = false,

    @Column(name = "last_played_at", nullable = false)
    var lastPlayedAt: Instant = Instant.now(),

    @Column(name = "flags")
    var flags: String? = null
)

@Entity
@Table(name = "daily_picks")
class DailyPickEntity(
    @Id
    @Column(name = "pick_date", nullable = false)
    val pickDate: java.time.LocalDate,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items", columnDefinition = "jsonb", nullable = false)
    var items: String,

    @Column(name = "generated_at", nullable = false)
    var generatedAt: Instant = Instant.now()
)

@Entity
@Table(
    name = "follows",
    uniqueConstraints = [
        UniqueConstraint(
            columnNames = ["follower_key", "followee_key"],
            name = "uk_follows_pair"
        )
    ]
)
class FollowEntity(
    @Column(name = "follower_key", nullable = false, columnDefinition = "uuid")
    val followerKey: UUID,

    @Column(name = "followee_key", nullable = false, columnDefinition = "uuid")
    val followeeKey: UUID,

    @Column(name = "followed_at", nullable = false)
    var followedAt: Instant = Instant.now()
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}

@Entity
@Table(name = "notifications")
class NotificationEntity(
    @Column(name = "recipient_key", nullable = false, columnDefinition = "uuid")
    val recipientKey: UUID,

    @Column(nullable = false, length = 32)
    val type: String,

    @Column(nullable = false, length = 120)
    val title: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    val message: String,

    @Column
    val link: String? = null,

    @Column(nullable = false)
    var read: Boolean = false
) : BaseEntity() {

    @Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID()
}

@Entity
@Table(name = "game_settings")
class GameSettingEntity(
    @Id
    @Column(name = "subject_key", columnDefinition = "uuid")
    val subjectKey: UUID,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "settings", columnDefinition = "jsonb", nullable = false)
    var settings: String,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
