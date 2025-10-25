package org.example.lineagew.domain.sale

import org.example.lineagew.common.SaleState
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface SaleRepository : JpaRepository<Sale, Long> {
    fun findAllByState(state: SaleState): List<Sale>
}

interface DistributionRuleRepository : JpaRepository<DistributionRule, Long> {
    fun findBySaleId(saleId: Long): DistributionRule?
}

interface PayoutRepository : JpaRepository<Payout, Long> {
    fun findAllBySaleId(saleId: Long): List<Payout>
    fun deleteAllBySaleId(saleId: Long)

    @Query(
        "select p from Payout p " +
            "join fetch p.sale s " +
            "join fetch p.member m " +
            "where s.soldAt between :from and :to " +
            "and s.state = org.example.lineagew.common.SaleState.FINALIZED"
    )
    fun findAllFinalizedBetween(
        @Param("from") from: java.time.LocalDateTime,
        @Param("to") to: java.time.LocalDateTime
    ): List<Payout>
}

interface ParticipationBonusLogRepository : JpaRepository<ParticipationBonusLog, Long> {
    fun deleteAllBySaleId(saleId: Long)

    @Query(
        "select log from ParticipationBonusLog log " +
            "join fetch log.sale s " +
            "join fetch log.member m " +
            "where s.soldAt between :from and :to"
    )
    fun findAllWithinSaleRange(
        @Param("from") from: java.time.LocalDateTime,
        @Param("to") to: java.time.LocalDateTime
    ): List<ParticipationBonusLog>
}
