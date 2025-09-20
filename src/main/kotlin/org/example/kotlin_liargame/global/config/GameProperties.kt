package org.example.kotlin_liargame.global.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "game.properties")
data class GameProperties(
    // 플레이어 설정
    val minPlayers: Int = 3,
    val maxPlayers: Int = 15,

    // 시간 제한 설정 (초 단위)
    val turnTimeoutSeconds: Long = 60L,
    val votingTimeSeconds: Long = 60L,
    val defenseTimeSeconds: Long = 60L,
    val finalVotingTimeSeconds: Long = 30L,
    val topicGuessTimeSeconds: Long = 30L,

    // 채팅 설정
    val postRoundChatDurationSeconds: Long = 7L,
    val maxMessageLength: Int = 500,

    // 게임 관리 설정
    val maxGameDurationHours: Long = 2L,
    val sessionExtensionMinutes: Long = 5L,
    val phaseTransitionDelaySeconds: Long = 3L,

    // AI 판정 설정
    val answerSimilarityThreshold: Double = 0.7,

    // 게임 정리 설정
    val gameCleanupIntervalSeconds: Long = 30L
)
