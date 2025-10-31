package org.example.kotlin_liargame.domain.nemonemo.V1.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "nemonemo_creator_submission")
class NemonemoCreatorSubmissionEntity(
    @Column(name = "creator_user_id", nullable = false)
    val creatorUserId: Long,

    @Column(name = "puzzle_payload", columnDefinition = "TEXT", nullable = false)
    val puzzlePayload: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: CreatorSubmissionStatus = CreatorSubmissionStatus.DRAFT,

    @Column(name = "reviewer_user_id")
    var reviewerUserId: Long? = null,

    @Column(name = "review_notes", columnDefinition = "TEXT")
    var reviewNotes: String? = null
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
