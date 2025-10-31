package org.example.kotlin_liargame.domain.nemonemo.v2.model

import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.ForeignKey
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.Lob
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.example.kotlin_liargame.global.base.BaseEntity
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "puzzles")
class PuzzleEntity(
    @Column(nullable = false, length = 120)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(nullable = false)
    var width: Int,

    @Column(nullable = false)
    var height: Int,

    @Column(name = "author_id")
    var authorId: UUID? = null,

    @Column(name = "author_anon_id")
    var authorAnonId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: PuzzleStatus = PuzzleStatus.DRAFT,

    @Enumerated(EnumType.STRING)
    @Column(name = "content_style", nullable = false, length = 20)
    var contentStyle: PuzzleContentStyle = PuzzleContentStyle.GENERIC_PIXEL,

    @Column(name = "text_likeness_score")
    var textLikenessScore: Double = 0.0,

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "puzzle_tags",
        joinColumns = [JoinColumn(name = "puzzle_id", referencedColumnName = "id")]
    )
    @Column(name = "tag_value", nullable = false, length = 40)
    var tags: MutableSet<String> = mutableSetOf(),

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "puzzle_compliance_flags",
        joinColumns = [JoinColumn(name = "puzzle_id", referencedColumnName = "id")]
    )
    @Column(name = "flag_value", nullable = false, length = 40)
    var complianceFlags: MutableSet<String> = mutableSetOf(),

    @Column(name = "uniqueness_flag", nullable = false)
    var uniquenessFlag: Boolean = false,

    @Column(name = "difficulty_score")
    var difficultyScore: Double? = null,

    @Column(name = "thumbnail_url")
    var thumbnailUrl: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id")
    var series: PuzzleSeriesEntity? = null,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @Column(name = "official_at")
    var officialAt: Instant? = null,

    @Column(name = "view_count", nullable = false)
    var viewCount: Long = 0,

    @Column(name = "play_count", nullable = false)
    var playCount: Long = 0,

    @Column(name = "clear_count", nullable = false)
    var clearCount: Long = 0,

    @Column(name = "avg_time_ms")
    var averageTimeMs: Long? = null,

    @Column(name = "avg_rating")
    var averageRating: Double? = null
) : BaseEntity() {

    @Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID()
}

@Entity
@Table(name = "puzzle_series")
class PuzzleSeriesEntity(
    @Column(name = "author_key", nullable = false, columnDefinition = "uuid")
    val authorKey: UUID,

    @Column(nullable = false, length = 120)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "thumbnail_url")
    var thumbnailUrl: String? = null,

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "puzzle_series_order",
        joinColumns = [JoinColumn(name = "series_id", referencedColumnName = "id")]
    )
    @Column(name = "puzzle_id", columnDefinition = "uuid")
    var puzzleOrder: MutableList<UUID> = mutableListOf()
) : BaseEntity() {

    @Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID()
}

@Entity
@Table(name = "puzzle_hints")
class PuzzleHintEntity(
    @Id
    @Column(name = "puzzle_id", columnDefinition = "uuid")
    val puzzleId: UUID,

    @Lob
    @Column(name = "rows", nullable = false)
    var rows: String,

    @Lob
    @Column(name = "cols", nullable = false)
    var cols: String,

    @Column(nullable = false)
    var version: Int = 1
)

@Entity
@Table(name = "puzzle_solutions")
class PuzzleSolutionEntity(
    @Id
    @Column(name = "puzzle_id", columnDefinition = "uuid")
    val puzzleId: UUID,

    @Lob
    @Column(name = "grid_data", nullable = false)
    var gridData: ByteArray,

    @Column(nullable = false, length = 128)
    var checksum: String
)

@Entity
@Table(name = "votes")
class PuzzleVoteEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    val puzzle: PuzzleEntity,

    @Column(name = "subject_key", nullable = false, columnDefinition = "uuid")
    val subjectKey: UUID,

    @Column(nullable = false)
    val value: Int
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}

@Entity
@Table(name = "comments")
class PuzzleCommentEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    val puzzle: PuzzleEntity,

    @Column(name = "author_key", nullable = false, columnDefinition = "uuid")
    val authorKey: UUID,

    @Column(columnDefinition = "TEXT", nullable = false)
    var content: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "parent_id",
        foreignKey = ForeignKey(name = "fk_comments_parent"),
        referencedColumnName = "id"
    )
    var parent: PuzzleCommentEntity? = null,

    @Column(nullable = false)
    var deleted: Boolean = false
) : BaseEntity() {

    @Id
    @Column(columnDefinition = "uuid")
    val id: UUID = UUID.randomUUID()
}

@Entity
@Table(name = "ratings")
class PuzzleRatingEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    val puzzle: PuzzleEntity,

    @Column(name = "rater_key", nullable = false, columnDefinition = "uuid")
    val raterKey: UUID,

    @Column(nullable = false)
    val stars: Int,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    val comment: PuzzleCommentEntity? = null
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
