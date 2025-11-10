package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class DailyPickScheduler(
    private val dailyPickService: DailyPickService
) {

    private val logger = LoggerFactory.getLogger(DailyPickScheduler::class.java)

    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Seoul")
    fun refreshDailyPick() {
        runCatching {
            dailyPickService.generateDailyPick(force = true)
        }.onFailure {
            logger.error("Failed to refresh daily pick", it)
        }
    }
}
