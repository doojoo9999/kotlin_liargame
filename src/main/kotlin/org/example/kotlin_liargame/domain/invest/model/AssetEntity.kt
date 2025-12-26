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
import jakarta.persistence.UniqueConstraint
import java.math.BigDecimal
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(
    name = "portfolio_asset",
    uniqueConstraints = [UniqueConstraint(columnNames = ["portfolio_id", "stock_code", "market_type"]) ]
)
class AssetEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    val portfolio: PortfolioEntity,

    @Column(name = "stock_code", nullable = false, length = 20)
    val stockCode: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "market_type", nullable = false, length = 10)
    var marketType: MarketType,

    @Column(name = "average_price", nullable = false, precision = 19, scale = 4)
    var averagePrice: BigDecimal,

    @Column(nullable = false, precision = 19, scale = 4)
    var quantity: BigDecimal
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
