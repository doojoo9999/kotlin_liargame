package org.example.kotlin_liargame.domain.nemonemo.model

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
import java.time.LocalDateTime

@Entity
@Table(name = "nemonemo_puzzle_release")
class NemonemoPuzzleReleaseEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    val puzzle: NemonemoPuzzleEntity,

    @Column(name = "release_pack", nullable = false, length = 40)
    val releasePack: String,

    @Column(name = "release_at", nullable = false)
    val releaseAt: LocalDateTime,

    @Column(name = "expires_at")
    val expiresAt: LocalDateTime? = null,

    @Column(name = "display_order")
    val displayOrder: Int? = null,

    @Column(name = "is_featured", nullable = false)
    val isFeatured: Boolean = false
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
