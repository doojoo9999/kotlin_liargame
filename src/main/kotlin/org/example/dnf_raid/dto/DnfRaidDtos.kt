package org.example.dnf_raid.dto

import jakarta.validation.Valid
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
    val jobId: String? = null,
    val jobGrowId: String? = null,
    val fame: Int,
    val damage: Long,
    val buffPower: Long,
    val calculatedDealer: Double? = null,
    val calculatedBuffer: Double? = null,
    val adventureName: String?,
    val imageUrl: String
)

data class DnfCharacterLoadoutDto(
    val characterId: String,
    val serverId: String,
    val updatedAt: LocalDateTime,
    /** 저장된 섹션 여부를 가볍게 확인하기 위한 플래그 */
    val fields: Map<String, Boolean>
)

data class DnfCalculatedDamageDto(
    val characterId: String,
    val serverId: String,
    val dealerScore: Double?,
    val bufferScore: Double?,
    val calculatedAt: LocalDateTime
)

data class DealerSkillScoreDto(
    val name: String,
    val level: Int,
    val coeff: Double,
    val baseCd: Double,
    val realCd: Double,
    val singleDamage: Double,
    val casts: Double,
    val score: Double
)

data class DealerDamageDetailDto(
    val totalScore: Double,
    val skills: List<DealerSkillScoreDto>
)

data class DamageCalculationDetailDto(
    val characterId: String,
    val serverId: String,
    val dealer: DealerDamageDetailDto?,
    val bufferScore: Double?,
    val calculatedAt: LocalDateTime
)

data class ManualCharacterInput(
    @field:NotBlank(message = "serverId를 입력해주세요.")
    val serverId: String,
    @field:NotBlank(message = "characterId를 입력해주세요.")
    val characterId: String
)

data class SyncLoadoutsRequest(
    val includeRegisteredCharacters: Boolean = true,
    @field:Size(max = 50, message = "한 번에 최대 50개까지만 동기화할 수 있습니다.")
    @field:Valid
    val manualCharacters: List<ManualCharacterInput> = emptyList(),
    /** 분 단위, 0이면 staleness 체크 없이 비어 있는 것만 동기화 */
    @field:Min(0)
    val staleMinutes: Int = 0
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

data class PartyTargetRequest(
    @field:Positive(message = "딜 목표는 1 이상이어야 합니다.")
    val damageTarget: Long,
    @field:Positive(message = "버프 목표는 1 이상이어야 합니다.")
    val buffTarget: Long
)

data class AutoFillRequest(
    @field:NotEmpty(message = "레이드 ID가 필요합니다.")
    val raidIds: List<UUID>,
    @field:Min(1, message = "파티 수는 1 이상이어야 합니다.")
    @field:Max(4, message = "파티 수는 4 이하이어야 합니다.")
    val partyCount: Int = 3,
    @field:Min(1, message = "파티 슬롯은 1 이상이어야 합니다.")
    @field:Max(8, message = "파티 슬롯은 8 이하이어야 합니다.")
    val slotsPerParty: Int = 4,
    val partyTargets: List<PartyTargetRequest>? = null
)

data class AutoFillRaidResult(
    val raidId: UUID,
    val name: String,
    val usedCount: Int,
    val duplicateAdventureCount: Int,
    val unplacedCount: Int
)

data class AutoFillResponse(
    val results: List<AutoFillRaidResult>,
    val raids: List<RaidDetailResponse>
)

data class UpdongAutoFillRequest(
    @field:NotEmpty(message = "레이드 ID가 필요합니다.")
    val raidIds: List<UUID>,
    @field:Min(1, message = "파티 수는 1 이상이어야 합니다.")
    @field:Max(4, message = "파티 수는 4 이하이어야 합니다.")
    val partyCount: Int = 3,
    @field:Min(1, message = "파티 슬롯은 1 이상이어야 합니다.")
    @field:Max(8, message = "파티 슬롯은 8 이하이어야 합니다.")
    val slotsPerParty: Int = 4
)

data class UpdongAutoFillResponse(
    val assignedCount: Int,
    val missingCount: Int,
    val raids: List<RaidDetailResponse>
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
