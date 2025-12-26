package org.example.kotlin_liargame.domain.invest.service

import java.math.BigDecimal
import java.math.RoundingMode
import org.example.kotlin_liargame.domain.invest.model.enum.Currency
import org.example.kotlin_liargame.domain.invest.repository.ExchangeRateRepository
import org.springframework.stereotype.Service

@Service
class CurrencyService(
    private val exchangeRateRepository: ExchangeRateRepository
) {
    fun convert(amount: BigDecimal, from: Currency, to: Currency): BigDecimal {
        if (from == to) {
            return FinancialMath.scalePrice(amount)
        }
        val rate = resolveRate(from, to)
        val converted = if (from == Currency.USD && to == Currency.KRW) {
            amount.multiply(rate, FinancialMath.MATH_CONTEXT)
        } else if (from == Currency.KRW && to == Currency.USD) {
            amount.divide(rate, FinancialMath.RATE_SCALE, RoundingMode.HALF_UP)
        } else {
            throw IllegalArgumentException("Unsupported currency conversion: $from -> $to")
        }
        return FinancialMath.scalePrice(converted)
    }

    fun latestUsdKrwRate(): BigDecimal = FinancialMath.scaleRate(resolveRate(Currency.USD, Currency.KRW))

    private fun resolveRate(from: Currency, to: Currency): BigDecimal {
        val direct = exchangeRateRepository
            .findTopByBaseCurrencyAndQuoteCurrencyOrderByAsOfDesc(from, to)
            ?.rate
        if (direct != null) {
            return FinancialMath.scaleRate(direct)
        }
        val inverse = exchangeRateRepository
            .findTopByBaseCurrencyAndQuoteCurrencyOrderByAsOfDesc(to, from)
            ?.rate
        if (inverse != null) {
            return FinancialMath.scaleRate(BigDecimal.ONE.divide(inverse, FinancialMath.RATE_SCALE, RoundingMode.HALF_UP))
        }
        throw IllegalStateException("Exchange rate not found for $from/$to")
    }
}
