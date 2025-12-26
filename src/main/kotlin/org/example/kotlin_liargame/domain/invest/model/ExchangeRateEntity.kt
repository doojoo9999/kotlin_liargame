package org.example.kotlin_liargame.domain.invest.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDateTime
import org.example.kotlin_liargame.domain.invest.model.enum.Currency
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "exchange_rate")
class ExchangeRateEntity(
    @Enumerated(EnumType.STRING)
    @Column(name = "base_currency", nullable = false, length = 10)
    val baseCurrency: Currency,

    @Enumerated(EnumType.STRING)
    @Column(name = "quote_currency", nullable = false, length = 10)
    val quoteCurrency: Currency,

    @Column(nullable = false, precision = 19, scale = 6)
    val rate: BigDecimal,

    @Column(name = "as_of", nullable = false)
    val asOf: LocalDateTime
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
