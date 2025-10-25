package org.example.lineagew.application.dto

import jakarta.validation.Valid
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import org.example.lineagew.domain.bosskill.BossKill
import org.example.lineagew.domain.bosskill.BossKillParticipant
import java.math.BigDecimal
import java.time.LocalDateTime

data class BossKillParticipantPayload(
    @field:NotNull
    val memberId: Long,
    val baseWeight: BigDecimal = BigDecimal.ONE,
    val attendance: Boolean = true
)

data class BossKillCreateRequest(
    @field:NotNull
    val bossId: Long,

    @field:NotNull
    val killedAt: LocalDateTime,

    val notes: String? = null,

    @field:NotEmpty
    val participants: List<@Valid BossKillParticipantPayload>
)

data class BossKillResponse(
    val id: Long,
    val bossId: Long,
    val bossName: String,
    val killedAt: LocalDateTime,
    val notes: String?,
    val participants: List<BossKillParticipantResponse>
)

data class BossKillParticipantResponse(
    val id: Long,
    val memberId: Long,
    val memberName: String,
    val baseWeight: BigDecimal,
    val attendance: Boolean
)

fun BossKill.toResponse(): BossKillResponse = BossKillResponse(
    id = requireNotNull(id),
    bossId = boss.id!!,
    bossName = boss.name,
    killedAt = killedAt,
    notes = notes,
    participants = participants.map(BossKillParticipant::toResponse)
)

fun BossKillParticipant.toResponse(): BossKillParticipantResponse = BossKillParticipantResponse(
    id = requireNotNull(id),
    memberId = member.id!!,
    memberName = member.name,
    baseWeight = baseWeight,
    attendance = attendanceFlag
)
