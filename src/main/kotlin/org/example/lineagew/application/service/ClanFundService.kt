package org.example.lineagew.application.service

import org.example.lineagew.application.dto.ClanFundResponse
import org.example.lineagew.application.dto.ClanFundTxnRequest
import org.example.lineagew.application.dto.ClanFundTxnResponse
import org.example.lineagew.application.dto.toResponse
import org.example.lineagew.common.ClanFundTxnType
import org.example.lineagew.domain.clanfund.ClanFund
import org.example.lineagew.domain.clanfund.ClanFundRepository
import org.example.lineagew.domain.clanfund.ClanFundTxn
import org.example.lineagew.domain.clanfund.ClanFundTxnRepository
import org.example.lineagew.domain.member.Member
import org.example.lineagew.domain.member.MemberRepository
import org.example.lineagew.domain.sale.Sale
import org.example.lineagew.domain.sale.SaleRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
class ClanFundService(
    private val clanFundRepository: ClanFundRepository,
    private val clanFundTxnRepository: ClanFundTxnRepository,
    private val memberRepository: MemberRepository,
    private val saleRepository: SaleRepository
) {

    @Transactional
    fun getDefaultFund(): ClanFund = clanFundRepository.findByName(ClanFund.DEFAULT_NAME)
        ?: clanFundRepository.save(ClanFund())

    @Transactional
    fun getSummary(): ClanFundResponse {
        val fund = getDefaultFund()
        val transactions = clanFundTxnRepository.findAllByClanFundIdOrderByOccurredAtDesc(fund.id!!)
        return ClanFundResponse(
            id = fund.id!!,
            name = fund.name,
            balance = fund.balance,
            transactions = transactions.map { it.toResponse() }
        )
    }

    @Transactional
    fun recordTransaction(request: ClanFundTxnRequest): ClanFundTxnResponse {
        val sale = request.relatedSaleId?.let { saleId ->
            saleRepository.findById(saleId)
                .orElseThrow { IllegalArgumentException("Sale not found: $saleId") }
        }
        return recordTransaction(
            type = request.type,
            amount = request.amount,
            title = request.title,
            memo = request.memo,
            occurredAt = request.occurredAt,
            sale = sale,
            actorMemberId = request.actorMemberId
        )
    }

    @Transactional
    fun recordTransaction(
        type: ClanFundTxnType,
        amount: Long,
        title: String,
        memo: String? = null,
        occurredAt: LocalDate = LocalDate.now(),
        sale: Sale? = null,
        actorMemberId: Long? = null
    ): ClanFundTxnResponse {
        val fund = getDefaultFund()
        val actor: Member? = actorMemberId?.let { memberRepository.findById(it).orElse(null) }
        val signedAmount = when (type) {
            ClanFundTxnType.INCOME -> amount
            ClanFundTxnType.EXPENSE -> -amount
            ClanFundTxnType.ADJUST -> amount
        }
        fund.apply(signedAmount)
        val txn = ClanFundTxn(
            clanFund = fund,
            occurredAt = occurredAt,
            type = type,
            amount = signedAmount,
            title = title,
            memo = memo,
            relatedSale = sale,
            createdBy = actor
        )
        val saved = clanFundTxnRepository.save(txn)
        return saved.toResponse()
    }
}
