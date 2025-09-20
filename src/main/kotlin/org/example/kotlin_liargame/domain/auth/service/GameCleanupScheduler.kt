package org.example.kotlin_liargame.domain.auth.service

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
class GameCleanupScheduler(
    private val adminService: AdminService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @Scheduled(cron = "0 0 3 * * *")
    fun cleanupStaleGamesScheduled() {
        logger.info("=== 스케줄링된 오래된 게임방 정리 시작 ===")
        try {
            val cleanedGames = adminService.cleanupStaleGames()
            logger.info("스케줄링된 게임방 정리 완료: {}개 게임방 삭제", cleanedGames)
        } catch (e: Exception) {
            logger.error("스케줄링된 게임방 정리 중 오류 발생", e)
        }
    }

    /**
     * 매 5초마다 WebSocket 연결 상태 체크 및 정리 (사용자 요청에 따라 유지)
     */
    @Scheduled(fixedRate = 5000) // 5초 = 5 * 1000ms
    fun monitorWebSocketConnections() {
        try {
            val cleanedPlayers = adminService.cleanupOrphanedPlayers()
            if (cleanedPlayers > 0) {
                logger.info("WebSocket 연결 끊김 감지 및 정리: {}명 정리", cleanedPlayers)
            }
        } catch (e: Exception) {
            logger.error("WebSocket 연결 상태 모니터링 중 오류 발생", e)
        }
    }

    @Scheduled(fixedRate = 10000) // 10초 = 10 * 1000ms
    fun cleanupDisconnectedPlayersRealtime() {
        try {
            val cleanedPlayers = adminService.cleanupDisconnectedPlayers()
            if (cleanedPlayers > 0) {
                logger.info("실시간 고아 플레이어 정리 완료: {}명 정리", cleanedPlayers)
            }
        } catch (e: Exception) {
            logger.error("실시간 연결 해제 플레이어 정리 중 오류 발생", e)
        }
    }

    @Scheduled(fixedRate = 30000) // 30초 = 30 * 1000ms
    fun cleanupEmptyGamesRealtime() {
        logger.debug("=== 개선된 게임방 정리 시작 ===")
        try {
            val cleanedGames = adminService.cleanupEmptyGames()
            if (cleanedGames > 0) {
                logger.info("개선된 게임방 정리 완료: {}개 게임방 삭제", cleanedGames)
            }
        } catch (e: Exception) {
            logger.error("개선된 게임방 정리 중 오류 발생", e)
        }
    }

    @Scheduled(fixedRate = 3600000) // 1시간 = 60 * 60 * 1000ms
    fun logGameStatistics() {
        try {
            val stats = adminService.getGameStatistics()
            logger.info("=== 게임 통계 ===")
            logger.info("총 게임: {}, 대기 중: {}, 진행 중: {}, 종료: {}",
                stats["totalGames"], stats["waitingGames"],
                stats["inProgressGames"], stats["endedGames"])
            logger.info("총 플레이어: {}, 활성: {}, 연결 해제: {}",
                stats["totalPlayers"], stats["activePlayers"],
                stats["disconnectedPlayers"])
        } catch (e: Exception) {
            logger.error("게임 통계 로깅 중 오류 발생", e)
        }
    }

    @Scheduled(cron = "0 0 2 * * *")
    fun systemHealthCheck() {
        logger.info("=== 시스템 상태 점검 시작 ===")
        try {
            val stats = adminService.getGameStatistics()
            val totalGames = stats["totalGames"] as Long
            val disconnectedPlayers = stats["disconnectedPlayers"] as Long

            if (disconnectedPlayers > 10) {
                logger.warn("연결 해제된 플레이어가 많습니다: {}명", disconnectedPlayers)
            }

            if (totalGames > 100) {
                logger.warn("게임방이 많습니다: {}개", totalGames)
            }

            logger.info("시스템 상태 점검 완료")
        } catch (e: Exception) {
            logger.error("시스템 상태 점검 중 오류 발생", e)
        }
    }
}
