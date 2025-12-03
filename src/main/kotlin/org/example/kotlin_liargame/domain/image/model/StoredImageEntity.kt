package org.example.kotlin_liargame.domain.image.model

import jakarta.persistence.Basic
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Lob
import jakarta.persistence.Table
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "stored_image")
class StoredImageEntity(
    @Column(nullable = false, unique = true, length = 32)
    val slug: String,

    @Column(nullable = false, length = 120)
    val contentType: String,

    @Column(nullable = false)
    val size: Long,

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(nullable = false)
    val data: ByteArray,

    @Column(name = "original_filename", length = 255)
    val originalFilename: String? = null,

    uploaderIp: String? = null,
    uploaderSessionId: String? = null
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    init {
        this.ipAddress = uploaderIp
        this.sessionId = uploaderSessionId
    }
}
