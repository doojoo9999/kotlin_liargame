package org.example.kotlin_liargame.global.redis

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.global.config.GameStateStorageProperties
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

@Profile("!test")
@Service
class GameStateService(
    private val redisTemplate: RedisTemplate<String, String>,
    private val objectMapper: ObjectMapper,
    private val storageProperties: GameStateStorageProperties
) {

    private val logger = LoggerFactory.getLogger(this::class.java)
    private val useRedis = storageProperties.useRedis()
    private val useMemory = storageProperties.useInMemory()

    private val defenseStatusCache = ConcurrentHashMap<Int, DefenseStatus>()
    private val finalVotingStatusCache = ConcurrentHashMap<Int, MutableMap<Long, Boolean?>>()
    private val defenseTimerCache = ConcurrentHashMap<Int, Boolean>()
    private val finalVotingTimerCache = ConcurrentHashMap<Int, Boolean>()
    private val liarGuessStatusCache = ConcurrentHashMap<Int, EnhancedLiarGuessStatus>()
    private val terminationReasonCache = ConcurrentHashMap<Int, String>()
    private val postRoundChatCache = ConcurrentHashMap<Int, Instant>()
    private val finalVotingLockCache = ConcurrentHashMap<Int, Instant>()
    private val terminationCount = AtomicLong(0)

    private fun defenseStatusKey(gameNumber: Int) = "game:$gameNumber:defense:status"
    private fun finalVotingKey(gameNumber: Int) = "game:$gameNumber:voting:final"
    private fun defenseTimerKey(gameNumber: Int) = "game:$gameNumber:timer:defense"
    private fun finalVotingTimerKey(gameNumber: Int) = "game:$gameNumber:timer:finalvoting"
    private fun liarGuessStatusKey(gameNumber: Int) = "game:$gameNumber:liar:guess"
    private fun terminationReasonKey(gameNumber: Int) = "game:$gameNumber:termination:reason"
    private fun postRoundChatKey(gameNumber: Int) = "game:$gameNumber:chat:postround"
    private fun terminationCountKey() = "game:termination:count"
    private fun finalVotingProcessLockKey(gameNumber: Int) = "game:$gameNumber:voting:final:lock"

    private fun writeToRedis(description: String, action: () -> Unit) {
        if (!useRedis) return
        runCatching(action).onFailure { ex ->
            logger.warn("Redis write failed for $description: ${ex.message}")
        }
    }

    private fun <T> readFromRedis(description: String, action: () -> T?): T? {
        if (!useRedis) return null
        return runCatching(action).onFailure { ex ->
            logger.warn("Redis read failed for $description: ${ex.message}")
        }.getOrNull()
    }

    fun setDefenseStatus(gameNumber: Int, status: DefenseStatus) {
        if (useMemory) {
            defenseStatusCache[gameNumber] = status
        }
        writeToRedis("defenseStatus") {
            val json = objectMapper.writeValueAsString(status)
            redisTemplate.opsForValue().set(defenseStatusKey(gameNumber), json, Duration.ofHours(2))
        }
    }

    fun getDefenseStatus(gameNumber: Int): DefenseStatus? {
        val redisValue = readFromRedis("defenseStatus") {
            redisTemplate.opsForValue().get(defenseStatusKey(gameNumber))
        }?.let { objectMapper.readValue(it, DefenseStatus::class.java) }
        if (redisValue != null) {
            if (useMemory) defenseStatusCache[gameNumber] = redisValue
            return redisValue
        }
        return if (useMemory) defenseStatusCache[gameNumber] else null
    }

    fun removeDefenseStatus(gameNumber: Int) {
        if (useMemory) {
            defenseStatusCache.remove(gameNumber)
        }
        writeToRedis("defenseStatus.remove") {
            redisTemplate.delete(defenseStatusKey(gameNumber))
        }
    }

    fun setFinalVotingStatus(gameNumber: Int, status: Map<Long, Boolean?>) {
        if (useMemory) {
            finalVotingStatusCache[gameNumber] = status.toMutableMap()
        }
        writeToRedis("finalVotingStatus") {
            val json = objectMapper.writeValueAsString(status)
            redisTemplate.opsForValue().set(finalVotingKey(gameNumber), json, Duration.ofHours(2))
        }
    }

    fun getFinalVotingStatus(gameNumber: Int): MutableMap<Long, Boolean?> {
        val redisValue = readFromRedis("finalVotingStatus") {
            redisTemplate.opsForValue().get(finalVotingKey(gameNumber))
        }?.let {
            val typeRef = objectMapper.typeFactory.constructMapType(
                MutableMap::class.java,
                Long::class.java,
                Boolean::class.java
            )
            objectMapper.readValue<MutableMap<Long, Boolean?>>(it, typeRef)
        }
        if (redisValue != null) {
            if (useMemory) finalVotingStatusCache[gameNumber] = redisValue.toMutableMap()
            return redisValue
        }
        return if (useMemory) {
            finalVotingStatusCache[gameNumber]?.toMutableMap() ?: mutableMapOf()
        } else {
            mutableMapOf()
        }
    }

    fun removeFinalVotingStatus(gameNumber: Int) {
        if (useMemory) {
            finalVotingStatusCache.remove(gameNumber)
        }
        writeToRedis("finalVotingStatus.remove") {
            redisTemplate.delete(finalVotingKey(gameNumber))
        }
    }

    fun setDefenseTimer(gameNumber: Int, active: Boolean) {
        if (useMemory) {
            defenseTimerCache[gameNumber] = active
        }
        writeToRedis("defenseTimer") {
            redisTemplate.opsForValue().set(
                defenseTimerKey(gameNumber),
                active.toString(),
                Duration.ofHours(2)
            )
        }
    }

    fun getDefenseTimer(gameNumber: Int): Boolean {
        val redisValue = readFromRedis("defenseTimer") {
            redisTemplate.opsForValue().get(defenseTimerKey(gameNumber))
        }?.toBoolean()
        if (redisValue != null) {
            if (useMemory) defenseTimerCache[gameNumber] = redisValue
            return redisValue
        }
        return if (useMemory) defenseTimerCache[gameNumber] ?: false else false
    }

    fun removeDefenseTimer(gameNumber: Int) {
        if (useMemory) {
            defenseTimerCache.remove(gameNumber)
        }
        writeToRedis("defenseTimer.remove") {
            redisTemplate.delete(defenseTimerKey(gameNumber))
        }
    }

    fun setFinalVotingTimer(gameNumber: Int, active: Boolean) {
        if (useMemory) {
            finalVotingTimerCache[gameNumber] = active
        }
        writeToRedis("finalVotingTimer") {
            redisTemplate.opsForValue().set(
                finalVotingTimerKey(gameNumber),
                active.toString(),
                Duration.ofHours(2)
            )
        }
    }

    fun getFinalVotingTimer(gameNumber: Int): Boolean {
        val redisValue = readFromRedis("finalVotingTimer") {
            redisTemplate.opsForValue().get(finalVotingTimerKey(gameNumber))
        }?.toBoolean()
        if (redisValue != null) {
            if (useMemory) finalVotingTimerCache[gameNumber] = redisValue
            return redisValue
        }
        return if (useMemory) finalVotingTimerCache[gameNumber] ?: false else false
    }

    fun removeFinalVotingTimer(gameNumber: Int) {
        if (useMemory) {
            finalVotingTimerCache.remove(gameNumber)
        }
        writeToRedis("finalVotingTimer.remove") {
            redisTemplate.delete(finalVotingTimerKey(gameNumber))
        }
    }

    fun setLiarGuessStatus(gameNumber: Int, status: EnhancedLiarGuessStatus) {
        if (useMemory) {
            liarGuessStatusCache[gameNumber] = status
        }
        writeToRedis("liarGuessStatus") {
            val json = objectMapper.writeValueAsString(status)
            redisTemplate.opsForValue().set(liarGuessStatusKey(gameNumber), json, Duration.ofHours(2))
        }
    }

    fun getLiarGuessStatus(gameNumber: Int): EnhancedLiarGuessStatus? {
        val redisValue = readFromRedis("liarGuessStatus") {
            redisTemplate.opsForValue().get(liarGuessStatusKey(gameNumber))
        }?.let { objectMapper.readValue(it, EnhancedLiarGuessStatus::class.java) }
        if (redisValue != null) {
            if (useMemory) liarGuessStatusCache[gameNumber] = redisValue
            return redisValue
        }
        return if (useMemory) liarGuessStatusCache[gameNumber] else null
    }

    fun removeLiarGuessStatus(gameNumber: Int) {
        if (useMemory) {
            liarGuessStatusCache.remove(gameNumber)
        }
        writeToRedis("liarGuessStatus.remove") {
            redisTemplate.delete(liarGuessStatusKey(gameNumber))
        }
    }

    fun setTerminationReason(gameNumber: Int, reason: String) {
        if (useMemory) {
            terminationReasonCache[gameNumber] = reason
            terminationCount.incrementAndGet()
        }
        writeToRedis("terminationReason") {
            redisTemplate.opsForValue().set(
                terminationReasonKey(gameNumber),
                reason,
                Duration.ofHours(24)
            )
            redisTemplate.opsForValue().increment(terminationCountKey())
        }
    }

    fun getTerminationReason(gameNumber: Int): String? {
        val redisValue = readFromRedis("terminationReason") {
            redisTemplate.opsForValue().get(terminationReasonKey(gameNumber))
        }
        if (redisValue != null) {
            if (useMemory) terminationReasonCache[gameNumber] = redisValue
            return redisValue
        }
        return if (useMemory) terminationReasonCache[gameNumber] else null
    }

    fun getTotalTerminations(): Long {
        val redisValue = readFromRedis("terminationCount") {
            redisTemplate.opsForValue().get(terminationCountKey())
        }?.toLongOrNull()
        if (redisValue != null) {
            if (useMemory) terminationCount.set(redisValue)
            return redisValue
        }
        return if (useMemory) terminationCount.get() else 0L
    }

    fun setPostRoundChatWindow(gameNumber: Int, endTime: Instant) {
        if (useMemory) {
            postRoundChatCache[gameNumber] = endTime
        }
        writeToRedis("postRoundChat") {
            redisTemplate.opsForValue().set(
                postRoundChatKey(gameNumber),
                endTime.toString(),
                Duration.between(Instant.now(), endTime.plusSeconds(60))
            )
        }
    }

    fun getPostRoundChatWindow(gameNumber: Int): Instant? {
        val redisValue = readFromRedis("postRoundChat") {
            redisTemplate.opsForValue().get(postRoundChatKey(gameNumber))
        }?.let { Instant.parse(it) }
        if (redisValue != null) {
            if (useMemory) postRoundChatCache[gameNumber] = redisValue
            return redisValue
        }
        return if (useMemory) postRoundChatCache[gameNumber] else null
    }

    fun removePostRoundChatWindow(gameNumber: Int) {
        if (useMemory) {
            postRoundChatCache.remove(gameNumber)
        }
        writeToRedis("postRoundChat.remove") {
            redisTemplate.delete(postRoundChatKey(gameNumber))
        }
    }

    fun acquireFinalVotingProcessLock(gameNumber: Int, lockTimeoutSeconds: Long = 30): Boolean {
        val now = Instant.now()
        var acquired = false

        if (useRedis) {
            val redisResult = readFromRedis("finalVotingLock.acquire") {
                redisTemplate.opsForValue().setIfAbsent(
                    finalVotingProcessLockKey(gameNumber),
                    "locked",
                    Duration.ofSeconds(lockTimeoutSeconds)
                )
            }
            if (redisResult == true) {
                acquired = true
            }
        }

        if (useMemory) {
            val expiration = now.plusSeconds(lockTimeoutSeconds)
            var memoryAcquired = false
            finalVotingLockCache.compute(gameNumber) { _, existing ->
                if (existing == null || now.isAfter(existing)) {
                    memoryAcquired = true
                    expiration
                } else {
                    existing
                }
            }
            if (memoryAcquired) {
                acquired = true
            }
        }

        return acquired
    }

    fun releaseFinalVotingProcessLock(gameNumber: Int) {
        if (useMemory) {
            finalVotingLockCache.remove(gameNumber)
        }
        writeToRedis("finalVotingLock.release") {
            redisTemplate.delete(finalVotingProcessLockKey(gameNumber))
        }
    }

    fun hasFinalVotingProcessLock(gameNumber: Int): Boolean {
        if (useRedis) {
            val hasRedisLock = readFromRedis("finalVotingLock.check") {
                redisTemplate.hasKey(finalVotingProcessLockKey(gameNumber))
            }
            if (hasRedisLock == true) {
                return true
            }
        }

        if (useMemory) {
            finalVotingLockCache.computeIfPresent(gameNumber) { _, expiration ->
                if (Instant.now().isAfter(expiration)) null else expiration
            }
            return finalVotingLockCache.containsKey(gameNumber)
        }

        return false
    }

    fun cleanupGameState(gameNumber: Int) {
        if (useMemory) {
            defenseStatusCache.remove(gameNumber)
            finalVotingStatusCache.remove(gameNumber)
            defenseTimerCache.remove(gameNumber)
            finalVotingTimerCache.remove(gameNumber)
            liarGuessStatusCache.remove(gameNumber)
            terminationReasonCache.remove(gameNumber)
            postRoundChatCache.remove(gameNumber)
            finalVotingLockCache.remove(gameNumber)
        }

        writeToRedis("cleanupGameState") {
            val keys = listOf(
                defenseStatusKey(gameNumber),
                finalVotingKey(gameNumber),
                defenseTimerKey(gameNumber),
                finalVotingTimerKey(gameNumber),
                liarGuessStatusKey(gameNumber),
                terminationReasonKey(gameNumber),
                postRoundChatKey(gameNumber)
            )
            redisTemplate.delete(keys)
        }
    }
}

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
    var timedOut: Boolean = false,
    var resolvedAt: Instant? = null
) {
    fun markResolved(isCorrectGuess: Boolean) {
        this.isCorrect = isCorrectGuess
        this.resolvedAt = Instant.now()
    }
}
