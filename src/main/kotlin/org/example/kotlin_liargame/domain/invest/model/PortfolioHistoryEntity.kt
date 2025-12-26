package org.example.kotlin_liargame.domain.invest.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDate
import org.example.kotlin_liargame.domain.invest.model.enum.Currency
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "portfolio_history")
class PortfolioHistoryEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    val portfolio: PortfolioEntity,

    @Column(name = "as_of_date", nullable = false)
    val asOfDate: LocalDate,

    @Enumerated(EnumType.STRING)
    @Column(name = "market_type", length = 10)
    val marketType: MarketType? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "base_currency", nullable = false, length = 10)
    val baseCurrency: Currency,

    @Column(name = "total_value", nullable = false, precision = 19, scale = 4)
    val totalValue: BigDecimal
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
