package org.example.kotlin_liargame.global.redis

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

@Profile("test")
@Service
class GameStateService(
    private val objectMapper: ObjectMapper
) {
    private data class Timers(
        var defenseTimer: Boolean = false,
        var finalVotingTimer: Boolean = false,
        var postRoundChatEnd: Instant? = null,
        var finalVotingLockUntil: Instant? = null
    )

    private val defenseStatusMap = ConcurrentHashMap<Int, DefenseStatus>()
    private val finalVotingMap = ConcurrentHashMap<Int, MutableMap<Long, Boolean?>>()
    private val liarGuessMap = ConcurrentHashMap<Int, EnhancedLiarGuessStatus>()
    private val terminationReasonMap = ConcurrentHashMap<Int, String>()
    private val terminationCount = java.util.concurrent.atomic.AtomicLong(0)
    private val timers = ConcurrentHashMap<Int, Timers>()

    fun setDefenseStatus(gameNumber: Int, status: DefenseStatus) {
        defenseStatusMap[gameNumber] = status
    }

    fun getDefenseStatus(gameNumber: Int): DefenseStatus? = defenseStatusMap[gameNumber]

    fun removeDefenseStatus(gameNumber: Int) {
        defenseStatusMap.remove(gameNumber)
    }

    fun setFinalVotingStatus(gameNumber: Int, status: Map<Long, Boolean?>) {
        finalVotingMap[gameNumber] = status.toMutableMap()
    }

    fun getFinalVotingStatus(gameNumber: Int): MutableMap<Long, Boolean?> =
        finalVotingMap[gameNumber] ?: mutableMapOf()

    fun removeFinalVotingStatus(gameNumber: Int) {
        finalVotingMap.remove(gameNumber)
    }

    fun setDefenseTimer(gameNumber: Int, active: Boolean) {
        timers.computeIfAbsent(gameNumber) { Timers() }.defenseTimer = active
    }

    fun getDefenseTimer(gameNumber: Int): Boolean = timers[gameNumber]?.defenseTimer ?: false

    fun removeDefenseTimer(gameNumber: Int) {
        timers[gameNumber]?.defenseTimer = false
    }

    fun setFinalVotingTimer(gameNumber: Int, active: Boolean) {
        timers.computeIfAbsent(gameNumber) { Timers() }.finalVotingTimer = active
    }

    fun getFinalVotingTimer(gameNumber: Int): Boolean = timers[gameNumber]?.finalVotingTimer ?: false

    fun removeFinalVotingTimer(gameNumber: Int) {
        timers[gameNumber]?.finalVotingTimer = false
    }

    fun setLiarGuessStatus(gameNumber: Int, status: EnhancedLiarGuessStatus) {
        liarGuessMap[gameNumber] = status
    }

    fun getLiarGuessStatus(gameNumber: Int): EnhancedLiarGuessStatus? = liarGuessMap[gameNumber]

    fun removeLiarGuessStatus(gameNumber: Int) {
        liarGuessMap.remove(gameNumber)
    }

    fun setTerminationReason(gameNumber: Int, reason: String) {
        terminationReasonMap[gameNumber] = reason
        terminationCount.incrementAndGet()
    }

    fun getTerminationReason(gameNumber: Int): String? = terminationReasonMap[gameNumber]

    fun getTotalTerminations(): Long = terminationCount.get()

    fun setPostRoundChatWindow(gameNumber: Int, endTime: Instant) {
        timers.computeIfAbsent(gameNumber) { Timers() }.postRoundChatEnd = endTime
    }

    fun getPostRoundChatWindow(gameNumber: Int): Instant? = timers[gameNumber]?.postRoundChatEnd

    fun removePostRoundChatWindow(gameNumber: Int) {
        timers[gameNumber]?.postRoundChatEnd = null
    }

    fun acquireFinalVotingProcessLock(gameNumber: Int, lockTimeoutSeconds: Long = 30): Boolean {
        val t = timers.computeIfAbsent(gameNumber) { Timers() }
        val now = Instant.now()
        return if (t.finalVotingLockUntil == null || now.isAfter(t.finalVotingLockUntil)) {
            t.finalVotingLockUntil = now.plusSeconds(lockTimeoutSeconds)
            true
        } else {
            false
        }
    }

    fun releaseFinalVotingProcessLock(gameNumber: Int) {
        timers[gameNumber]?.finalVotingLockUntil = null
    }

    fun hasFinalVotingProcessLock(gameNumber: Int): Boolean {
        val until = timers[gameNumber]?.finalVotingLockUntil
        return until != null && Instant.now().isBefore(until)
    }

    fun cleanupGameState(gameNumber: Int) {
        defenseStatusMap.remove(gameNumber)
        finalVotingMap.remove(gameNumber)
        liarGuessMap.remove(gameNumber)
        timers.remove(gameNumber)
        terminationReasonMap.remove(gameNumber)
    }
}

// Keep the same DTOs as main profile for compatibility
data class DefenseStatus(
    val accusedPlayerId: Long,
    val defenseText: String? = null,
    val isDefenseSubmitted: Boolean = false
)

data class EnhancedLiarGuessStatus(
    val liarPlayerId: Long,
    val guessTimeLimit: Int,
    val startTime: Instant,
    var remainingTime: Int,
    var guessSubmitted: Boolean = false,
    var guessText: String? = null,
    var isCorrect: Boolean? = null,
    var timedOut: Boolean = false
)