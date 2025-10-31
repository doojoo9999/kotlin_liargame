package org.example.kotlin_liargame.domain.nemonemo.v2.model

enum class PuzzleStatus {
    DRAFT,
    APPROVED,
    OFFICIAL,
    REJECTED
}

enum class PuzzleMode {
    NORMAL,
    TIME_ATTACK,
    MULTIPLAYER
}

enum class PuzzleContentStyle {
    GENERIC_PIXEL,
    CLI_ASCII,
    LETTERFORM,
    SYMBOLIC,
    MIXED
}

enum class ChallengeType {
    DAILY,
    WEEKLY,
    MONTHLY
}

enum class AchievementTier {
    BRONZE,
    SILVER,
    GOLD,
    PLATINUM
}

enum class MultiplayerMode {
    COOP,
    VERSUS,
    RELAY
}

enum class MultiplayerStatus {
    WAITING,
    IN_PROGRESS,
    FINISHED
}
