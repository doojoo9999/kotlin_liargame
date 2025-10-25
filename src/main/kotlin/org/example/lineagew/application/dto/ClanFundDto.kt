package org.example.lineagew.application.dto

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import org.example.lineagew.common.ClanFundTxnType
import org.example.lineagew.domain.clanfund.ClanFundTxn
import java.time.LocalDate

data class ClanFundTxnRequest(
    val type: ClanFundTxnType,

    @field:Min(0)
    val amount: Long,

    @field:NotBlank
    val title: String,
    val memo: String? = null,
    val occurredAt: LocalDate = LocalDate.now(),
    val relatedSaleId: Long? = null,
    val actorMemberId: Long? = null
)

data class ClanFundTxnResponse(
    val id: Long,
    val type: ClanFundTxnType,
    val amount: Long,
    val title: String,
    val memo: String?,
    val occurredAt: LocalDate,
    val relatedSaleId: Long?,
    val actorMemberId: Long?
)

data class ClanFundResponse(
    val id: Long,
    val name: String,
    val balance: Long,
    val transactions: List<ClanFundTxnResponse>
)

fun ClanFundTxn.toResponse(): ClanFundTxnResponse = ClanFundTxnResponse(
    id = requireNotNull(id),
    type = type,
    amount = amount,
    title = title,
    memo = memo,
    occurredAt = occurredAt,
    relatedSaleId = relatedSale?.id,
    actorMemberId = createdBy?.id
)
