package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayResultDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlaySubmitRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PlayEntity
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import kotlin.math.max

@Component
class ScoringService(
    @Value("\${nemonemo.scoring.baseMultiplier:1000}") private val baseMultiplier: Int,
    @Value("\${nemonemo.scoring.timeMultiplier:5}") private val timeMultiplier: Int,
    @Value("\${nemonemo.scoring.comboMultiplier:2}") private val comboMultiplier: Int,
    @Value("\${nemonemo.scoring.perfectBonus:500}") private val perfectBonus: Int,
    @Value("\${nemonemo.scoring.mistakePenalty:50}") private val mistakePenalty: Int,
    @Value("\${nemonemo.scoring.hintPenalty:100}") private val hintPenalty: Int
) {

    fun calculateScore(
        play: PlayEntity,
        request: PlaySubmitRequest,
        difficultyWeight: Double
    ): ScoreBreakdown {
        val clearBonus = baseMultiplier * difficultyWeight
        val targetTime = play.puzzle.width * play.puzzle.height * 1000L
        val timeBonus = max(0, (targetTime - request.elapsedMs).toInt() / 1000) * timeMultiplier
        val comboBonus = request.comboCount * comboMultiplier
        val perfectBonusScore = if (request.mistakes == 0) perfectBonus else 0
        val penalty = (request.mistakes * mistakePenalty) + (request.usedHints * hintPenalty)
        val finalScore = (clearBonus + timeBonus + comboBonus + perfectBonusScore - penalty).toInt().coerceAtLeast(0)

        return ScoreBreakdown(
            finalScore = finalScore,
            timeBonus = timeBonus,
            comboBonus = comboBonus,
            perfectBonus = perfectBonusScore,
            penalty = penalty
        )
    }

    fun buildResult(
        play: PlayEntity,
        breakdown: ScoreBreakdown,
        leaderboardRank: Int?,
        elapsedMs: Long
    ): PlayResultDto = PlayResultDto(
        puzzleId = play.puzzle.id,
        playId = play.id,
        score = breakdown.finalScore,
        elapsedMs = elapsedMs,
        comboBonus = breakdown.comboBonus,
        perfectClear = breakdown.perfectBonus > 0,
        leaderboardRank = leaderboardRank
    )
}

data class ScoreBreakdown(
    val finalScore: Int,
    val timeBonus: Int,
    val comboBonus: Int,
    val perfectBonus: Int,
    val penalty: Int
)
