package org.example.kotlin_liargame.domain.invest.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "portfolio")
class PortfolioEntity(
    @Column(nullable = false, length = 80)
    val name: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    val owner: PortfolioUserEntity,

    @OneToMany(mappedBy = "portfolio", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val assets: MutableList<AssetEntity> = mutableListOf(),

    @OneToMany(mappedBy = "portfolio", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val tradeHistory: MutableList<TradeHistoryEntity> = mutableListOf()
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
