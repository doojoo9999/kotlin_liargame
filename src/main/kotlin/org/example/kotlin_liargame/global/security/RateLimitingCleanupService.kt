package org.example.kotlin_liargame.global.security

import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
class RateLimitingCleanupService(
    private val rateLimitingService: RateLimitingService
) {


    @Scheduled(fixedRate = 300000) // 5분 = 300,000ms
    fun cleanupExpiredRateLimitRecords() {
        try {
            rateLimitingService.cleanupExpiredRequests()
            println("[CLEANUP] Rate limiting records cleanup completed")
        } catch (e: Exception) {
            println("[ERROR] Failed to cleanup rate limiting records: ${e.message}")
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
            
            println("[MONITORING] Memory Usage - Used: ${usedMemory / 1024 / 1024}MB, " +
                    "Free: ${freeMemory / 1024 / 1024}MB, " +
                    "Total: ${totalMemory / 1024 / 1024}MB, " +
                    "Max: ${maxMemory / 1024 / 1024}MB")
        } catch (e: Exception) {
            println("[ERROR] Failed to log memory usage: ${e.message}")
        }
    }
}