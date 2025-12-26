package org.example.kotlin_liargame.domain.invest.service

import java.time.DayOfWeek
import java.time.LocalTime
import java.time.ZoneId
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.springframework.stereotype.Service

@Service
class MarketStatusService {
    private val krZone = ZoneId.of("Asia/Seoul")
    private val usZone = ZoneId.of("America/New_York")

    fun isMarketOpen(marketType: MarketType): Boolean {
        return when (marketType) {
            MarketType.KR -> isKrMarketOpen()
            MarketType.US -> isUsMarketOpen()
        }
    }

    fun isKrMarketOpen(): Boolean {
        val now = java.time.ZonedDateTime.now(krZone)
        if (now.dayOfWeek == DayOfWeek.SATURDAY || now.dayOfWeek == DayOfWeek.SUNDAY) {
            return false
        }
        val time = now.toLocalTime()
        return !time.isBefore(LocalTime.of(9, 0)) && time.isBefore(LocalTime.of(15, 30))
    }

    fun isUsMarketOpen(): Boolean {
        val now = java.time.ZonedDateTime.now(usZone)
        if (now.dayOfWeek == DayOfWeek.SATURDAY || now.dayOfWeek == DayOfWeek.SUNDAY) {
            return false
        }
        val time = now.toLocalTime()
        return !time.isBefore(LocalTime.of(9, 30)) && time.isBefore(LocalTime.of(16, 0))
    }
}
