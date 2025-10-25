package org.example.lineagew.domain.clanfund

import org.springframework.data.jpa.repository.JpaRepository

interface ClanFundRepository : JpaRepository<ClanFund, Long> {
    fun findByName(name: String): ClanFund?
}

interface ClanFundTxnRepository : JpaRepository<ClanFundTxn, Long> {
    fun findAllByClanFundIdOrderByOccurredAtDesc(clanFundId: Long): List<ClanFundTxn>
}
