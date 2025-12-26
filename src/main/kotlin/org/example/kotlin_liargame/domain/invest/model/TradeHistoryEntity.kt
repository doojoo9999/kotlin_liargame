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
import java.time.LocalDateTime
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.example.kotlin_liargame.domain.invest.model.enum.TradeType
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "trade_history")
class TradeHistoryEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    val portfolio: PortfolioEntity,

    @Column(name = "stock_code", nullable = false, length = 20)
    val stockCode: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "market_type", nullable = false, length = 10)
    val marketType: MarketType,

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", nullable = false, length = 10)
    val tradeType: TradeType,

    @Column(name = "trade_price", nullable = false, precision = 19, scale = 4)
    val tradePrice: BigDecimal,

    @Column(nullable = false, precision = 19, scale = 4)
    val quantity: BigDecimal,

    @Column(name = "traded_at", nullable = false)
    val tradedAt: LocalDateTime = LocalDateTime.now()
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
