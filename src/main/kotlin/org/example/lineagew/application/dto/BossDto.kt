package org.example.lineagew.application.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.example.lineagew.domain.boss.Boss

data class BossRequest(
    @field:NotBlank
    @field:Size(max = 120)
    val name: String,

    val tier: String? = null,
    val memo: String? = null
)

data class BossResponse(
    val id: Long,
    val name: String,
    val tier: String?,
    val memo: String?
)

fun Boss.toResponse(): BossResponse = BossResponse(
    id = requireNotNull(id),
    name = name,
    tier = tier,
    memo = memo
)
