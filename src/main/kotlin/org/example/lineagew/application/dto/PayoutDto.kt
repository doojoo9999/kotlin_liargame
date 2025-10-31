package org.example.lineagew.application.dto

import jakarta.validation.constraints.NotNull
import org.example.lineagew.common.ItemGrade
import org.example.lineagew.common.PayoutStatus
import org.example.lineagew.domain.sale.Payout
import java.time.LocalDateTime

data class PayoutDetailResponse(
    val id: Long,
    val memberId: Long,
    val memberName: String,
    val amount: Long,
    val status: PayoutStatus,
    val saleId: Long,
    val soldAt: LocalDateTime,
    val saleMemo: String?,
    val itemId: Long,
    val itemName: String,
    val itemGrade: ItemGrade,
    val bossKillId: Long?,
    val bossName: String?,
    val bossKilledAt: LocalDateTime?,
    val paidAt: LocalDateTime?,
    val paidNote: String?,
    val paidByMemberId: Long?,
    val paidByMemberName: String?
)

fun Payout.toDetailResponse(): PayoutDetailResponse {
    val sale = sale
    val item = sale.item
    val bossKill = item.sourceBossKill
    val boss = bossKill?.boss

    return PayoutDetailResponse(
        id = requireNotNull(id),
        memberId = member.id!!,
        memberName = member.name,
        amount = amount,
        status = status,
        saleId = sale.id!!,
        soldAt = sale.soldAt,
        saleMemo = sale.memo,
        itemId = item.id!!,
        itemName = item.name,
        itemGrade = item.grade,
        bossKillId = bossKill?.id,
        bossName = boss?.name,
        bossKilledAt = bossKill?.killedAt,
        paidAt = paidAt,
        paidNote = paidNote,
        paidByMemberId = paidByMember?.id,
        paidByMemberName = paidByMember?.name
    )
}

data class PayoutStatusUpdateRequest(
    @field:NotNull
    val status: PayoutStatus,
    val paidAt: LocalDateTime? = null,
    val note: String? = null,
    val paidByMemberId: Long? = null
)
