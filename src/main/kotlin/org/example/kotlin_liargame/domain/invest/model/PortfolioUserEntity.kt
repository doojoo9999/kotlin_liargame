package org.example.kotlin_liargame.domain.invest.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(
    name = "portfolio_user",
    uniqueConstraints = [UniqueConstraint(columnNames = ["email"]) ]
)
class PortfolioUserEntity(
    @Column(nullable = false, length = 120)
    val email: String,

    @Column(nullable = false, length = 60)
    val displayName: String,

    @OneToMany(mappedBy = "owner", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val portfolios: MutableList<PortfolioEntity> = mutableListOf()
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
