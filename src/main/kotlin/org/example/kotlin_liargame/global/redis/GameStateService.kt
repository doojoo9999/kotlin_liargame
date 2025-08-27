package org.example.kotlin_liargame.global.redis

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant

@Service
class GameStateService(
    private val redisTemplate: RedisTemplate<String, String>,
    private val objectMapper: ObjectMapper
) {

    private fun defenseStatusKey(gameNumber: Int) = "game:$gameNumber:defense:status"
    private fun finalVotingKey(gameNumber: Int) = "game:$gameNumber:voting:final"
    private fun defenseTimerKey(gameNumber: Int) = "game:$gameNumber:timer:defense"
    private fun finalVotingTimerKey(gameNumber: Int) = "game:$gameNumber:timer:finalvoting"
    private fun liarGuessStatusKey(gameNumber: Int) = "game:$gameNumber:liar:guess"
    private fun terminationReasonKey(gameNumber: Int) = "game:$gameNumber:termination:reason"
    private fun postRoundChatKey(gameNumber: Int) = "game:$gameNumber:chat:postround"
    private fun terminationCountKey() = "game:termination:count"

    fun setDefenseStatus(gameNumber: Int, status: DefenseStatus) {
        val json = objectMapper.writeValueAsString(status)
        redisTemplate.opsForValue().set(defenseStatusKey(gameNumber), json, Duration.ofHours(2))
    }

    fun getDefenseStatus(gameNumber: Int): DefenseStatus? {
        val json = redisTemplate.opsForValue().get(defenseStatusKey(gameNumber))
        return json?.let { objectMapper.readValue(it, DefenseStatus::class.java) }
    }

    fun removeDefenseStatus(gameNumber: Int) {
        redisTemplate.delete(defenseStatusKey(gameNumber))
    }

    fun setFinalVotingStatus(gameNumber: Int, status: Map<Long, Boolean?>) {
        val json = objectMapper.writeValueAsString(status)
        redisTemplate.opsForValue().set(finalVotingKey(gameNumber), json, Duration.ofHours(2))
    }

    fun getFinalVotingStatus(gameNumber: Int): MutableMap<Long, Boolean?> {
        val json = redisTemplate.opsForValue().get(finalVotingKey(gameNumber))
        return json?.let {
            val typeRef = objectMapper.typeFactory.constructMapType(
                MutableMap::class.java,
                Long::class.java,
                Boolean::class.java
            )
            objectMapper.readValue<MutableMap<Long, Boolean?>>(it, typeRef)
        } ?: mutableMapOf()
    }

    fun removeFinalVotingStatus(gameNumber: Int) {
        redisTemplate.delete(finalVotingKey(gameNumber))
    }

    fun setDefenseTimer(gameNumber: Int, active: Boolean) {
        redisTemplate.opsForValue().set(
            defenseTimerKey(gameNumber),
            active.toString(),
            Duration.ofHours(2)
        )
    }

    fun getDefenseTimer(gameNumber: Int): Boolean {
        return redisTemplate.opsForValue().get(defenseTimerKey(gameNumber))?.toBoolean() ?: false
    }

    fun removeDefenseTimer(gameNumber: Int) {
        redisTemplate.delete(defenseTimerKey(gameNumber))
    }

    fun setFinalVotingTimer(gameNumber: Int, active: Boolean) {
        redisTemplate.opsForValue().set(
            finalVotingTimerKey(gameNumber),
            active.toString(),
            Duration.ofHours(2)
        )
    }

    fun getFinalVotingTimer(gameNumber: Int): Boolean {
        return redisTemplate.opsForValue().get(finalVotingTimerKey(gameNumber))?.toBoolean() ?: false
    }

    fun removeFinalVotingTimer(gameNumber: Int) {
        redisTemplate.delete(finalVotingTimerKey(gameNumber))
    }

    fun setLiarGuessStatus(gameNumber: Int, status: EnhancedLiarGuessStatus) {
        val json = objectMapper.writeValueAsString(status)
        redisTemplate.opsForValue().set(liarGuessStatusKey(gameNumber), json, Duration.ofHours(2))
    }

    fun getLiarGuessStatus(gameNumber: Int): EnhancedLiarGuessStatus? {
        val json = redisTemplate.opsForValue().get(liarGuessStatusKey(gameNumber))
        return json?.let { objectMapper.readValue(it, EnhancedLiarGuessStatus::class.java) }
    }

    fun removeLiarGuessStatus(gameNumber: Int) {
        redisTemplate.delete(liarGuessStatusKey(gameNumber))
    }

    fun setTerminationReason(gameNumber: Int, reason: String) {
        redisTemplate.opsForValue().set(
            terminationReasonKey(gameNumber),
            reason,
            Duration.ofHours(24)
        )
        // 종료 카운트 증가
        redisTemplate.opsForValue().increment(terminationCountKey())
    }

    fun getTerminationReason(gameNumber: Int): String? {
        return redisTemplate.opsForValue().get(terminationReasonKey(gameNumber))
    }

    fun getTotalTerminations(): Long {
        return redisTemplate.opsForValue().get(terminationCountKey())?.toLong() ?: 0L
    }

    fun setPostRoundChatWindow(gameNumber: Int, endTime: Instant) {
        redisTemplate.opsForValue().set(
            postRoundChatKey(gameNumber),
            endTime.toString(),
            Duration.between(Instant.now(), endTime.plusSeconds(60))
        )
    }

    fun getPostRoundChatWindow(gameNumber: Int): Instant? {
        val timeStr = redisTemplate.opsForValue().get(postRoundChatKey(gameNumber))
        return timeStr?.let { Instant.parse(it) }
    }

    fun removePostRoundChatWindow(gameNumber: Int) {
        redisTemplate.delete(postRoundChatKey(gameNumber))
    }

    fun cleanupGameState(gameNumber: Int) {
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
