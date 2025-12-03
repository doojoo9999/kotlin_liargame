package org.example.kotlin_liargame.domain.image.repository

import org.example.kotlin_liargame.domain.image.model.StoredImageEntity
import org.springframework.data.jpa.repository.JpaRepository

interface StoredImageRepository : JpaRepository<StoredImageEntity, Long> {
    fun findBySlug(slug: String): StoredImageEntity?
    fun existsBySlug(slug: String): Boolean
}
