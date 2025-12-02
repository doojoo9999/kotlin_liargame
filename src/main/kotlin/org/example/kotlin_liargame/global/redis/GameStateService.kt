package org.example.kotlin_liargame.global.redis

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
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
    private val redisTemplate: RedisTemplate<String, String>?,
    private val objectMapper: ObjectMapper,
    private val storageProperties: GameStateStorageProperties
) {

    private val logger = LoggerFactory.getLogger(this::class.java)
    private val useRedis = storageProperties.useRedis() && redisTemplate != null
    private val useMemory = storageProperties.useInMemory()

    private val defenseStatusCache = ConcurrentHashMap<Int, DefenseStatus>()
    private val finalVotingStatusCache = ConcurrentHashMap<Int, MutableMap<Long, Boolean?>>()
    private val defenseTimerCache = ConcurrentHashMap<Int, Boolean>()
    private val finalVotingTimerCache = ConcurrentHashMap<Int, Boolean>()
    private val liarGuessStatusCache = ConcurrentHashMap<Int, EnhancedLiarGuessStatus>()
    private val terminationReasonCache = ConcurrentHashMap<Int, String>()
    private val postRoundChatCache = ConcurrentHashMap<Int, Instant>()
    private val finalVotingLockCache = ConcurrentHashMap<Int, Instant>()
    private val liarGuessTimerLockCache = ConcurrentHashMap<Int, Instant>()
    private val terminationCount = AtomicLong(0)

    private fun defenseStatusKey(gameNumber: Int) = "game:$gameNumber:defense:status"
    private fun finalVotingKey(gameNumber: Int) = "game:$gameNumber:voting:final"
    private fun defenseTimerKey(gameNumber: Int) = "game:$gameNumber:timer:defense"
    private fun finalVotingTimerKey(gameNumber: Int) = "game:$gameNumber:timer:finalvoting"
    private fun liarGuessStatusKey(gameNumber: Int) = "game:$gameNumber:liar:guess"
    private fun liarGuessTimerLockKey(gameNumber: Int) = "game:$gameNumber:timer:liarguess"
    private fun terminationReasonKey(gameNumber: Int) = "game:$gameNumber:termination:reason"
    private fun postRoundChatKey(gameNumber: Int) = "game:$gameNumber:chat:postround"
    private fun terminationCountKey() = "game:termination:count"
    private fun finalVotingProcessLockKey(gameNumber: Int) = "game:$gameNumber:voting:final:lock"

    private fun writeToRedis(description: String, action: (RedisTemplate<String, String>) -> Unit) {
        val template = redisTemplate
        if (!useRedis || template == null) return
        runCatching { action(template) }.onFailure { ex ->
            logger.warn("Redis write failed for $description: ${ex.message}")
        }
    }

    private fun <T> readFromRedis(description: String, action: (RedisTemplate<String, String>) -> T?): T? {
        val template = redisTemplate
        if (!useRedis || template == null) return null
        return runCatching { action(template) }.onFailure { ex ->
            logger.warn("Redis read failed for $description: ${ex.message}")
        }.getOrNull()
    }

    fun setDefenseStatus(gameNumber: Int, status: DefenseStatus) {
        if (useMemory) {
            defenseStatusCache[gameNumber] = status
        }
        writeToRedis("defenseStatus") { template ->
            val json = objectMapper.writeValueAsString(status)
            template.opsForValue().set(defenseStatusKey(gameNumber), json, Duration.ofHours(2))
        }
    }

    fun getDefenseStatus(gameNumber: Int): DefenseStatus? {
        val redisValue = readFromRedis("defenseStatus") { template ->
            template.opsForValue().get(defenseStatusKey(gameNumber))
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
        writeToRedis("defenseStatus.remove") { template ->
            template.delete(defenseStatusKey(gameNumber))
        }
    }

    fun setFinalVotingStatus(gameNumber: Int, status: Map<Long, Boolean?>) {
        logger.debug("Persisting final voting status for game {} -> {}", gameNumber, status)
        if (useMemory) {
            finalVotingStatusCache[gameNumber] = status.toMutableMap()
        }
        val json = objectMapper.writeValueAsString(status)
        logger.debug("Serialized final voting status for game {}: {}", gameNumber, json)
        writeToRedis("finalVotingStatus") { template ->
            template.opsForValue().set(finalVotingKey(gameNumber), json, Duration.ofHours(2))
        }
    }

    fun getFinalVotingStatus(gameNumber: Int): MutableMap<Long, Boolean?> {
        val redisValue = readFromRedis("finalVotingStatus") { template ->
            template.opsForValue().get(finalVotingKey(gameNumber))
        }?.let { json ->
            logger.debug("Raw redis final voting payload for game {}: {}", gameNumber, json)
            val node = objectMapper.readTree(json)
            if (node is ObjectNode) {
                val parsed = mutableMapOf<Long, Boolean?>()
                node.fields().forEach { (key, value) ->
                    key.toLongOrNull()?.let { userId ->
                        parsed[userId] = if (value.isNull) null else value.asBoolean()
                    }
                }
                parsed
            } else {
                mutableMapOf()
            }
        }
        if (redisValue != null) {
            if (useMemory) finalVotingStatusCache[gameNumber] = redisValue.toMutableMap()
            logger.debug("Final voting status from redis for game {}: {}", gameNumber, redisValue)
            return redisValue
        }
        val memoryValue = if (useMemory) {
            finalVotingStatusCache[gameNumber]?.toMutableMap() ?: mutableMapOf()
        } else {
            mutableMapOf()
        }
        if (memoryValue.isNotEmpty()) {
            logger.debug("Final voting status from memory for game {}: {}", gameNumber, memoryValue)
        }
        return memoryValue
    }

    fun removeFinalVotingStatus(gameNumber: Int) {
        if (useMemory) {
            finalVotingStatusCache.remove(gameNumber)
        }
        writeToRedis("finalVotingStatus.remove") { template ->
            template.delete(finalVotingKey(gameNumber))
        }
    }

    fun setDefenseTimer(gameNumber: Int, active: Boolean) {
        if (useMemory) {
            defenseTimerCache[gameNumber] = active
        }
        writeToRedis("defenseTimer") { template ->
            template.opsForValue().set(
                defenseTimerKey(gameNumber),
                active.toString(),
                Duration.ofHours(2)
            )
        }
    }

    fun getDefenseTimer(gameNumber: Int): Boolean {
        val redisValue = readFromRedis("defenseTimer") { template ->
            template.opsForValue().get(defenseTimerKey(gameNumber))
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
        writeToRedis("defenseTimer.remove") { template ->
            template.delete(defenseTimerKey(gameNumber))
        }
    }

    fun setFinalVotingTimer(gameNumber: Int, active: Boolean) {
        if (useMemory) {
            finalVotingTimerCache[gameNumber] = active
        }
        writeToRedis("finalVotingTimer") { template ->
            template.opsForValue().set(
                finalVotingTimerKey(gameNumber),
                active.toString(),
                Duration.ofHours(2)
            )
        }
    }

    fun getFinalVotingTimer(gameNumber: Int): Boolean {
        val redisValue = readFromRedis("finalVotingTimer") { template ->
            template.opsForValue().get(finalVotingTimerKey(gameNumber))
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
        writeToRedis("finalVotingTimer.remove") { template ->
            template.delete(finalVotingTimerKey(gameNumber))
        }
    }

    fun setLiarGuessStatus(gameNumber: Int, status: EnhancedLiarGuessStatus) {
        if (useMemory) {
            liarGuessStatusCache[gameNumber] = status
        }
        writeToRedis("liarGuessStatus") { template ->
            val json = objectMapper.writeValueAsString(status)
            template.opsForValue().set(liarGuessStatusKey(gameNumber), json, Duration.ofHours(2))
        }
    }

    fun getLiarGuessStatus(gameNumber: Int): EnhancedLiarGuessStatus? {
        val redisValue = readFromRedis("liarGuessStatus") { template ->
            template.opsForValue().get(liarGuessStatusKey(gameNumber))
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
        writeToRedis("liarGuessStatus.remove") { template ->
            template.delete(liarGuessStatusKey(gameNumber))
        }
    }

    fun setTerminationReason(gameNumber: Int, reason: String) {
        if (useMemory) {
            terminationReasonCache[gameNumber] = reason
            terminationCount.incrementAndGet()
        }
        writeToRedis("terminationReason") { template ->
            template.opsForValue().set(
                terminationReasonKey(gameNumber),
                reason,
                Duration.ofHours(24)
            )
            template.opsForValue().increment(terminationCountKey())
        }
    }

    fun getTerminationReason(gameNumber: Int): String? {
        val redisValue = readFromRedis("terminationReason") { template ->
            template.opsForValue().get(terminationReasonKey(gameNumber))
        }
        if (redisValue != null) {
            if (useMemory) terminationReasonCache[gameNumber] = redisValue
            return redisValue
        }
        return if (useMemory) terminationReasonCache[gameNumber] else null
    }

    fun getTotalTerminations(): Long {
        val redisValue = readFromRedis("terminationCount") { template ->
            template.opsForValue().get(terminationCountKey())
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
        writeToRedis("postRoundChat") { template ->
            template.opsForValue().set(
                postRoundChatKey(gameNumber),
                endTime.toString(),
                Duration.between(Instant.now(), endTime.plusSeconds(60))
            )
        }
    }

    fun getPostRoundChatWindow(gameNumber: Int): Instant? {
        val redisValue = readFromRedis("postRoundChat") { template ->
            template.opsForValue().get(postRoundChatKey(gameNumber))
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
        writeToRedis("postRoundChat.remove") { template ->
            template.delete(postRoundChatKey(gameNumber))
        }
    }

    fun acquireFinalVotingProcessLock(gameNumber: Int, lockTimeoutSeconds: Long = 30): Boolean {
        val now = Instant.now()
        var acquired = false

        if (useRedis) {
            val redisResult = readFromRedis("finalVotingLock.acquire") { template ->
                template.opsForValue().setIfAbsent(
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
        writeToRedis("finalVotingLock.release") { template ->
            template.delete(finalVotingProcessLockKey(gameNumber))
        }
    }

    fun hasFinalVotingProcessLock(gameNumber: Int): Boolean {
        if (useRedis) {
            val hasRedisLock = readFromRedis("finalVotingLock.check") { template ->
                template.hasKey(finalVotingProcessLockKey(gameNumber))
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

    fun acquireLiarGuessTimerLock(gameNumber: Int, lockTimeoutSeconds: Long = 300): Boolean {
        val now = Instant.now()
        var acquired = false

        if (useRedis) {
            val redisResult = readFromRedis("liarGuessTimerLock.acquire") { template ->
                template.opsForValue().setIfAbsent(
                    liarGuessTimerLockKey(gameNumber),
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
            liarGuessTimerLockCache.compute(gameNumber) { _, existing ->
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

    fun releaseLiarGuessTimerLock(gameNumber: Int) {
        if (useMemory) {
            liarGuessTimerLockCache.remove(gameNumber)
        }
        writeToRedis("liarGuessTimerLock.release") { template ->
            template.delete(liarGuessTimerLockKey(gameNumber))
        }
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
            liarGuessTimerLockCache.remove(gameNumber)
        }

        writeToRedis("cleanupGameState") { template ->
            val keys = listOf(
                defenseStatusKey(gameNumber),
                finalVotingKey(gameNumber),
                defenseTimerKey(gameNumber),
                finalVotingTimerKey(gameNumber),
                liarGuessStatusKey(gameNumber),
                liarGuessTimerLockKey(gameNumber),
                terminationReasonKey(gameNumber),
                postRoundChatKey(gameNumber)
            )
            template.delete(keys)
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
