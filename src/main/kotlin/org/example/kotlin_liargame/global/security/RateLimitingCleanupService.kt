package org.example.kotlin_liargame.global.security

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
class RateLimitingCleanupService(
    private val rateLimitingService: RateLimitingService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)


    @Scheduled(fixedRate = 300000) // 5분 = 300,000ms
    fun cleanupExpiredRateLimitRecords() {
        try {
            rateLimitingService.cleanupExpiredRequests()
            logger.info("Rate limiting records cleanup completed")
        } catch (e: Exception) {
            logger.error("Failed to cleanup rate limiting records: {}", e.message, e)
        }
    }

    @Scheduled(fixedRate = 3600000) // 1시간 = 3,600,000ms
    fun logMemoryUsage() {
        try {
            val runtime = Runtime.getRuntime()
            val totalMemory = runtime.totalMemory()
            val freeMemory = runtime.freeMemory()
            val usedMemory = totalMemory - freeMemory
            val maxMemory = runtime.maxMemory()
            
            logger.info("Memory Usage - Used: {}MB, Free: {}MB, Total: {}MB, Max: {}MB",
                usedMemory / 1024 / 1024,
                freeMemory / 1024 / 1024,
                totalMemory / 1024 / 1024,
                maxMemory / 1024 / 1024
            )
        } catch (e: Exception) {
            logger.error("Failed to log memory usage: {}", e.message, e)
        }
    }
}