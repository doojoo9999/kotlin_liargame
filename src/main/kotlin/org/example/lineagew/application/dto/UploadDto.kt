package org.example.lineagew.application.dto

import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import java.time.LocalDateTime

data class UploadBossKillRow(
    val bossId: Long,
    val killedAt: LocalDateTime,
    val notes: String? = null,
    val participants: List<UploadParticipantRow>
)

data class UploadParticipantRow(
    val memberId: Long,
    val baseWeight: java.math.BigDecimal = java.math.BigDecimal.ONE,
    val attendance: Boolean = true
)

data class UploadSaleRow(
    @field:NotNull
    val sale: SaleCreateRequest,
    val finalize: FinalizeSaleRequest? = null
)

data class UploadPayload(
    val members: List<MemberCreateRequest> = emptyList(),
    val bosses: List<BossRequest> = emptyList(),
    val bossKills: List<@Valid UploadBossKillRow> = emptyList(),
    val items: List<ItemRequest> = emptyList(),
    val sales: List<@Valid UploadSaleRow> = emptyList(),
    val clanFundTransactions: List<ClanFundTxnRequest> = emptyList(),
    val essences: List<EssenceRequest> = emptyList()
)

data class UploadPreviewResponse(
    val memberCount: Int,
    val bossCount: Int,
    val bossKillCount: Int,
    val itemCount: Int,
    val saleCount: Int,
    val clanFundTxnCount: Int,
    val essenceCount: Int,
    val warnings: List<String>
)

data class UploadCommitResponse(
    val createdMembers: Int,
    val createdBosses: Int,
    val createdBossKills: Int,
    val createdItems: Int,
    val createdSales: Int,
    val finalizedSales: Int,
    val clanFundTxns: Int,
    val essences: Int
)
