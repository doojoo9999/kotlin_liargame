package org.example.lineagew.domain.clanfund

import jakarta.persistence.*
import org.example.lineagew.common.ClanFundTxnType
import org.example.lineagew.common.LineagewBaseEntity
import org.example.lineagew.domain.member.Member
import org.example.lineagew.domain.sale.Sale
import java.time.LocalDate

@Entity
@Table(name = "linw_clan_funds")
class ClanFund(
    @Column(nullable = false, unique = true, length = 60)
    var name: String = DEFAULT_NAME,

    @Column(nullable = false)
    var balance: Long = 0
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    fun apply(amount: Long) {
        balance += amount
    }

    companion object {
        const val DEFAULT_NAME = "MAIN"
    }
}

@Entity
@Table(name = "linw_clan_fund_txns")
class ClanFundTxn(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clan_fund_id", nullable = false)
    var clanFund: ClanFund,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var type: ClanFundTxnType,

    @Column(nullable = false)
    var amount: Long,

    @Column(nullable = false, length = 160)
    var title: String,

    @Column(columnDefinition = "text")
    var memo: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_sale_id")
    var relatedSale: Sale? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_member_id")
    var createdBy: Member? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
