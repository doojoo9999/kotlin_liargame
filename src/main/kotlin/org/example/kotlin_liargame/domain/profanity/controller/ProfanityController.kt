package org.example.kotlin_liargame.domain.profanity.controller

import jakarta.servlet.http.HttpSession
import jakarta.validation.Valid
import org.example.kotlin_liargame.domain.profanity.dto.request.SuggestProfanityRequest
import org.example.kotlin_liargame.domain.profanity.service.ProfanityService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/profanity")
class ProfanityController(
    private val profanityService: ProfanityService
) {
    @PostMapping("/suggest")
    fun suggestProfanity(
        @Valid @RequestBody request: SuggestProfanityRequest,
        session: HttpSession
    ): ResponseEntity<Unit> {
        profanityService.suggestWord(request, session)
        return ResponseEntity.ok().build()
    }
}
