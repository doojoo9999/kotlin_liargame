package org.example.lineagew.common

import java.time.Duration

enum class MemberStatus {
    ACTIVE,
    INACTIVE
}

enum class MemberRole {
    USER,
    ADMIN
}

enum class ItemGrade {
    COMMON,
    UNCOMMON,
    RARE,
    EPIC,
    LEGENDARY
}

enum class ItemStatus {
    IN_STOCK,
    RESERVED,
    SOLD
}

enum class SaleState {
    DRAFT,
    FINALIZED,
    CANCELED
}

enum class DistributionMode {
    EQUAL_SPLIT,
    WEIGHTED
}

enum class RoundingStrategy {
    FLOOR,
    ROUND,
    CEIL
}

enum class RemainderPolicy {
    TO_CLAN_FUND,
    HIGHEST_WEIGHT,
    OLDEST_MEMBER,
    MANUAL_MEMBER
}

enum class BonusWindow {
    WEEK,
    TWO_WEEKS,
    FOUR_WEEKS;

    fun toDuration(): Duration = when (this) {
        WEEK -> Duration.ofDays(7)
        TWO_WEEKS -> Duration.ofDays(14)
        FOUR_WEEKS -> Duration.ofDays(28)
    }
}

enum class BonusCurveType {
    STEP,
    LINEAR,
    LOGISTIC
}

enum class DecayPolicy {
    NONE,
    EXP_DECAY
}

enum class ClanFundTxnType {
    INCOME,
    EXPENSE,
    ADJUST
}

enum class PayoutStatus {
    PENDING,
    PAID
}

enum class AuditAction {
    CREATE_SALE,
    UPDATE_SALE,
    SETTLE_SALE,
    CANCEL_SALE,
    UPDATE_PAYOUT_STATUS,
    EDIT_RULE,
    UPDATE_CLAN_FUND,
    IMPORT_DATA
}

enum class AuditObjectType {
    MEMBER,
    BOSS,
    BOSS_KILL,
    ITEM,
    SALE,
    DISTRIBUTION_RULE,
    CLAN_FUND,
    ESSENCE,
    UPLOAD_SESSION
}
