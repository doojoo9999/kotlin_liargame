package org.example.kotlin_liargame.domain.invest.repository

import org.example.kotlin_liargame.domain.invest.model.ExchangeRateEntity
import org.example.kotlin_liargame.domain.invest.model.enum.Currency
import org.springframework.data.jpa.repository.JpaRepository

interface ExchangeRateRepository : JpaRepository<ExchangeRateEntity, Long> {
    fun findTopByBaseCurrencyAndQuoteCurrencyOrderByAsOfDesc(
        baseCurrency: Currency,
        quoteCurrency: Currency
    ): ExchangeRateEntity?
}
