package org.example.lineagew.application.dto

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import org.example.lineagew.domain.essence.Essence
import org.example.lineagew.domain.essence.EssenceTxn
import java.time.LocalDate

data class EssenceRequest(
    @field:NotBlank
    val name: String,
    val memo: String? = null
)

data class EssenceTxnRequest(
    @field:Min(0)
    val deltaQty: Long,
    val reason: String,
    val memo: String? = null,
    val occurredAt: LocalDate = LocalDate.now(),
    val increase: Boolean = true
)

data class EssenceResponse(
    val id: Long,
    val name: String,
    val quantity: Long,
    val memo: String?,
    val transactions: List<EssenceTxnResponse>
)

data class EssenceTxnResponse(
    val id: Long,
    val deltaQty: Long,
    val reason: String,
    val memo: String?,
    val occurredAt: LocalDate
)

fun Essence.toResponse(txns: List<EssenceTxn>): EssenceResponse = EssenceResponse(
    id = requireNotNull(id),
    name = name,
    quantity = quantity,
    memo = memo,
    transactions = txns.map { it.toResponse() }
)

fun EssenceTxn.toResponse(): EssenceTxnResponse = EssenceTxnResponse(
    id = requireNotNull(id),
    deltaQty = deltaQty,
    reason = reason,
    memo = memo,
    occurredAt = occurredAt
)
