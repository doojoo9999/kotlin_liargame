package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import org.example.kotlin_liargame.domain.nemonemo.v2.model.ChallengeType
import org.example.kotlin_liargame.domain.nemonemo.v2.service.ChallengeProgressService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v2/nemonemo")
class NemonemoChallengeV2Controller(
    private val challengeProgressService: ChallengeProgressService
) {

    @GetMapping("/achievements")
    fun achievements(
        @RequestHeader("X-Subject-Key") subjectKey: UUID
    ) = ResponseEntity.ok(
        challengeProgressService.getAchievements(subjectKey)
    )

    @GetMapping("/challenges")
    fun challenges(
        @RequestHeader("X-Subject-Key") subjectKey: UUID,
        @RequestParam(required = false) type: ChallengeType?
    ) = ResponseEntity.ok(
        challengeProgressService.getChallenges(subjectKey)
            .filter { type == null || it.type == type }
    )

    @GetMapping("/season-pass")
    fun seasonPass(
        @RequestHeader("X-Subject-Key") subjectKey: UUID
    ) = ResponseEntity.ok(
        challengeProgressService.getSeasonProgress(subjectKey)
    )
}
