package org.example.lineagew.application.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import org.example.lineagew.common.ItemGrade
import org.example.lineagew.common.ItemStatus
import org.example.lineagew.domain.item.Item
import java.time.LocalDateTime
import java.time.LocalDate

data class ItemRequest(
    @field:NotBlank
    val name: String,

    val grade: ItemGrade = ItemGrade.COMMON,
    val acquiredAt: LocalDate? = null,
    val sourceBossKillId: Long? = null,
    val status: ItemStatus = ItemStatus.IN_STOCK,
    val note: String? = null,
    val tags: List<String> = emptyList()
)

data class ItemResponse(
    val id: Long,
    val name: String,
    val grade: ItemGrade,
    val acquiredAt: LocalDate?,
    val sourceBossKillId: Long?,
    val status: ItemStatus,
    val note: String?,
    val tags: List<String>
)

fun Item.toResponse(): ItemResponse = ItemResponse(
    id = requireNotNull(id),
    name = name,
    grade = grade,
    acquiredAt = acquiredAt,
    sourceBossKillId = sourceBossKill?.id,
    status = status,
    note = note,
    tags = tags.map { it.tag }
)

data class ItemDetailResponse(
    val id: Long,
    val name: String,
    val grade: ItemGrade,
    val acquiredAt: LocalDate?,
    val sourceBossKillId: Long?,
    val status: ItemStatus,
    val note: String?,
    val tags: List<String>,
    val sourceBossKill: BossKillResponse?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

fun Item.toDetailResponse(): ItemDetailResponse = ItemDetailResponse(
    id = requireNotNull(id),
    name = name,
    grade = grade,
    acquiredAt = acquiredAt,
    sourceBossKillId = sourceBossKill?.id,
    status = status,
    note = note,
    tags = tags.map { it.tag },
    sourceBossKill = sourceBossKill?.toResponse(),
    createdAt = createdAt,
    updatedAt = updatedAt
)
