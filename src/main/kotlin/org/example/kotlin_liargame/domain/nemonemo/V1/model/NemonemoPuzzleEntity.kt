package org.example.kotlin_liargame.domain.nemonemo.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Lob
import jakarta.persistence.Table
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "nemonemo_puzzle")
class NemonemoPuzzleEntity(
    @Column(nullable = false, unique = true, length = 24)
    val code: String,

    @Column(nullable = false, length = 120)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(nullable = false)
    val width: Int,

    @Column(nullable = false)
    val height: Int,

    @Lob
    @Column(nullable = false)
    var solutionBlob: ByteArray,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var difficulty: PuzzleDifficulty,

    @Column(nullable = false)
    var estimatedMinutes: Int,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var sourceType: PuzzleSourceType = PuzzleSourceType.OFFICIAL,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: PuzzleLifecycleStatus = PuzzleLifecycleStatus.DRAFT,

    @Column(name = "difficulty_score")
    var difficultyScore: Double? = null,

    @Column(name = "validation_checksum", length = 64)
    var validationChecksum: String? = null,

    @Column(name = "creator_user_id")
    var creatorUserId: Long? = null
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
