package org.example.kotlin_liargame.domain.nemonemo.V1.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.example.kotlin_liargame.global.base.BaseEntity
import java.time.LocalDateTime

@Entity
@Table(name = "nemonemo_announcement")
class NemonemoAnnouncementEntity(
    @Column(nullable = false, length = 120)
    var title: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    var body: String,

    @Column(name = "visible_from", nullable = false)
    var visibleFrom: LocalDateTime,

    @Column(name = "visible_until")
    var visibleUntil: LocalDateTime? = null,

    @Column(name = "cta_url")
    var ctaUrl: String? = null,

    @Column(name = "created_by", nullable = false)
    var createdBy: Long
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
