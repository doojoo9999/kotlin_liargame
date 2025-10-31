package org.example.kotlin_liargame.domain.nemonemo.v2.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayAutosaveRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayResultDto
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayStartRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlayStartResponse
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PlaySubmitRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PlayEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreId
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PlayRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.Base64
import java.util.UUID

@Service
class PlaySessionService(
    private val puzzleRepository: PuzzleRepository,
    private val playRepository: PlayRepository,
    private val scoreRepository: ScoreRepository,
    private val scoringService: ScoringService,
    private val objectMapper: ObjectMapper
) {

    @Transactional
    fun startPlay(puzzleId: UUID, subjectKey: UUID, request: PlayStartRequest): PlayStartResponse {
        val puzzle = puzzleRepository.findById(puzzleId).orElseThrow()
        val play = PlayEntity(
            puzzle = puzzle,
            subjectKey = subjectKey,
            mode = request.mode,
            startedAt = Instant.now(),
            inputEvents = "[]"
        )
        val saved = playRepository.save(play)
        val stateToken = Base64.getUrlEncoder().encodeToString("${saved.id}:${saved.startedAt.toEpochMilli()}".toByteArray())
        return PlayStartResponse(
            playId = saved.id,
            stateToken = stateToken,
            expiresAt = saved.startedAt.plusSeconds(60 * 60)
        )
    }

    @Transactional
    fun autosave(playId: UUID, request: PlayAutosaveRequest) {
        val play = playRepository.findById(playId).orElseThrow()
        play.progressSnapshots = objectMapper.writeValueAsString(request.progress)
        playRepository.save(play)
    }

    @Transactional
    fun submit(playId: UUID, subjectKey: UUID, request: PlaySubmitRequest): PlayResultDto {
        val play = playRepository.findById(playId).orElseThrow()
        require(play.subjectKey == subjectKey) { "Subject mismatch" }
        play.finishedAt = Instant.now()
        play.mistakes = request.mistakes
        play.usedHints = request.usedHints
        play.undoCount = request.undoCount
        play.comboCount = request.comboCount
        playRepository.save(play)

        val difficultyWeight = play.puzzle.difficultyScore ?: 1.0
        val breakdown = scoringService.calculateScore(play, request, difficultyWeight)

        val scoreId = ScoreId(play.puzzle.id, subjectKey, play.mode)
        val score = scoreRepository.findById(scoreId).orElseGet { ScoreEntity(scoreId) }
        val improved = breakdown.finalScore > (score.bestScore ?: Int.MIN_VALUE)
        score.bestScore = maxOf(score.bestScore ?: 0, breakdown.finalScore)
        score.bestTimeMs = minOf(score.bestTimeMs ?: Long.MAX_VALUE, request.durationMs)
        score.perfectClear = score.perfectClear || breakdown.perfectBonus > 0
        score.lastPlayedAt = Instant.now()
        scoreRepository.save(score)

        val leaderboardRank = if (improved) {
            scoreRepository.findTop100ByIdPuzzleIdOrderByBestScoreDesc(play.puzzle.id)
                .sortedByDescending { it.bestScore ?: 0 }
                .indexOfFirst { it.id == scoreId }
                .takeIf { it >= 0 }?.plus(1)
        } else {
            null
        }
        return scoringService.buildResult(play, breakdown, leaderboardRank)
    }
}
