package org.example.kotlin_liargame.domain.word.controller

import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
import org.example.kotlin_liargame.domain.word.dto.response.WordListResponse
import org.example.kotlin_liargame.domain.word.service.WordService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/words")
class WordController (
    private val wordService: WordService
){
    @PostMapping("/applyw")
    fun applyWord(
        @RequestBody req : ApplyWordRequest
    ) {
        wordService.applyWord(req)
    }

    @DeleteMapping("/delw/{id}")
    fun deleteWord(
        @RequestParam wordId: Long
    ) {
        wordService.removeWord(wordId)
    }

    @GetMapping("/wlist")
    fun findAllWord(): List<WordListResponse> {
        return wordService.findAll()
    }
}
