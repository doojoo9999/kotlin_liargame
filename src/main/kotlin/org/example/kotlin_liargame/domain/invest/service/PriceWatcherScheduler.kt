package org.example.kotlin_liargame.domain.invest.service

import kotlinx.coroutines.runBlocking
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class PriceWatcherScheduler(
    private val priceWatcherService: PriceWatcherService
) {
    @Scheduled(fixedRateString = "\${invest.scheduler.price-watcher-interval-ms:60000}")
    fun watchPrices() = runBlocking {
        priceWatcherService.checkTargetsAndStops()
    }
}
