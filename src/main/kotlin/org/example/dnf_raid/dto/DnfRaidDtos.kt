package org.example.dnf_raid.dto

import jakarta.validation.constraints.*
import org.example.dnf_raid.model.CohortPreference
import java.time.LocalDateTime
import java.util.UUID

data class DnfCharacterDto(
    val characterId: String,
    val serverId: String,
    val characterName: String,
    val jobName: String,
    val jobGrowName: String,
    val fame: Int,
    val damage: Long,
    val buffPower: Long,
    val adventureName: String?,
    val imageUrl: String
)

data class ParticipantResponse(
    val id: UUID,
    val raidId: UUID,
    val damage: Long,
    val buffPower: Long,
    val partyNumber: Int?,
    val slotIndex: Int?,
    val cohortPreference: CohortPreference?,
    val character: DnfCharacterDto,
    val createdAt: LocalDateTime?
)

data class RaidDetailResponse(
    val id: UUID,
    val name: String,
    val userId: String,
    val isPublic: Boolean,
    val motherRaidId: UUID,
    val createdAt: LocalDateTime?,
    val participants: List<ParticipantResponse>
)

data class RaidSummaryResponse(
    val id: UUID,
    val name: String,
    val motherRaidId: UUID,
    val isPublic: Boolean,
    val createdAt: LocalDateTime?,
    val participantCount: Int
)

data class RaidGroupResponse(
    val motherRaidId: UUID,
    val name: String,
    val isPublic: Boolean,
    val primaryRaid: RaidDetailResponse,
    val cohorts: List<RaidSummaryResponse>
)

data class StatHistoryEntryResponse(
    val id: UUID,
    val damage: Long,
    val buffPower: Long,
    val createdAt: LocalDateTime?
)

data class StatHistoryResponse(
    val participantId: UUID,
    val history: List<StatHistoryEntryResponse>
)

data class CreateRaidRequest(
    @field:NotBlank(message = "레이드 이름을 입력해주세요.")
    val name: String,
    @field:NotBlank(message = "userId가 필요합니다.")
    val userId: String,
    val motherRaidId: UUID? = null,
    val password: String? = null,
    val isPublic: Boolean = false
)

data class CloneRaidRequest(
    val name: String? = null,
    val isPublic: Boolean? = null
)

data class AddParticipantRequest(
    @field:NotBlank(message = "serverId가 필요합니다.")
    val serverId: String,
    @field:NotBlank(message = "characterId가 필요합니다.")
    val characterId: String,
    @field:PositiveOrZero(message = "딜 수치는 0 이상이어야 합니다.")
    val damage: Long? = null,
    @field:PositiveOrZero(message = "버프력은 0 이상이어야 합니다.")
    val buffPower: Long? = null,
    @field:Min(1, message = "파티 번호는 1~3 사이여야 합니다.")
    @field:Max(3, message = "파티 번호는 1~3 사이여야 합니다.")
    val partyNumber: Int? = null,
    @field:Min(0, message = "슬롯 번호는 0~3 사이여야 합니다.")
    @field:Max(3, message = "슬롯 번호는 0~3 사이여야 합니다.")
    val slotIndex: Int? = null,
    val cohortPreference: CohortPreference? = null
)

data class UpdateRaidVisibilityRequest(
    val isPublic: Boolean
)

data class UpdateParticipantRequest(
    @field:PositiveOrZero(message = "딜 수치는 0 이상이어야 합니다.")
    val damage: Long? = null,
    @field:PositiveOrZero(message = "버프력은 0 이상이어야 합니다.")
    val buffPower: Long? = null,
    @field:Min(1, message = "파티 번호는 1~3 사이여야 합니다.")
    @field:Max(3, message = "파티 번호는 1~3 사이여야 합니다.")
    val partyNumber: Int? = null,
    @field:Min(0, message = "슬롯 번호는 0~3 사이여야 합니다.")
    @field:Max(3, message = "슬롯 번호는 0~3 사이여야 합니다.")
    val slotIndex: Int? = null
)

data class AddParticipantBatchRequest(
    @field:NotEmpty(message = "참가자 목록이 비어 있습니다.")
    @field:Size(max = 50, message = "한 번에 최대 50명까지 등록 가능합니다.")
    val participants: List<AddParticipantRequest>
)

data class RegisterCharacterRequest(
    @field:NotBlank(message = "serverId가 필요합니다.")
    val serverId: String,
    @field:NotBlank(message = "characterId가 필요합니다.")
    val characterId: String,
    @field:PositiveOrZero(message = "딜 수치는 0 이상이어야 합니다.")
    val damage: Long = 0,
    @field:PositiveOrZero(message = "버프력은 0 이상이어야 합니다.")
    val buffPower: Long = 0
)
