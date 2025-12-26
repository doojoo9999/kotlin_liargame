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
import org.example.kotlin_liargame.domain.invest.model.enum.InvestmentAction
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "stock_analysis_result")
class StockAnalysisResultEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id")
    val asset: AssetEntity? = null,

    @Column(name = "stock_code", nullable = false, length = 20)
    val stockCode: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "market_type", nullable = false, length = 10)
    val marketType: MarketType,

    @Column(name = "current_price", nullable = false, precision = 19, scale = 4)
    val currentPrice: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    val recommendation: InvestmentAction,

    @Column(name = "target_price", nullable = false, precision = 19, scale = 4)
    val targetPrice: BigDecimal,

    @Column(name = "stop_loss", nullable = false, precision = 19, scale = 4)
    val stopLoss: BigDecimal,

    @Column(name = "confidence_score", nullable = false)
    val confidenceScore: Int,

    @Column(name = "reasoning_short", nullable = false, length = 500)
    val reasoningShort: String,

    @Column(name = "target_hit_at")
    var targetHitAt: LocalDateTime? = null,

    @Column(name = "stop_loss_hit_at")
    var stopLossHitAt: LocalDateTime? = null
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
