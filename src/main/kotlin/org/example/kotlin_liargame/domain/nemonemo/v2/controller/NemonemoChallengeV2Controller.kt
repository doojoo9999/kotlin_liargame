package org.example.kotlin_liargame.domain.nemonemo.v2.controller

import org.example.kotlin_liargame.domain.nemonemo.v2.model.ChallengeType
import org.example.kotlin_liargame.domain.nemonemo.v2.service.ChallengeProgressService
import org.example.kotlin_liargame.global.security.RequireSubject
import org.example.kotlin_liargame.global.security.SubjectPrincipal
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v2/nemonemo")
class NemonemoChallengeV2Controller(
    private val challengeProgressService: ChallengeProgressService
) {

    @GetMapping("/achievements")
    fun achievements(
        @RequireSubject subject: SubjectPrincipal
    ) = ResponseEntity.ok(
        challengeProgressService.getAchievements(subject.subjectKey)
    )

    @GetMapping("/challenges")
    fun challenges(
        @RequireSubject subject: SubjectPrincipal,
        @RequestParam(required = false) type: ChallengeType?
    ) = ResponseEntity.ok(
        challengeProgressService.getChallenges(subject.subjectKey)
            .filter { type == null || it.type == type }
    )

    @GetMapping("/season-pass")
    fun seasonPass(
        @RequireSubject subject: SubjectPrincipal
    ) = ResponseEntity.ok(
        challengeProgressService.getSeasonProgress(subject.subjectKey)
    )
}
