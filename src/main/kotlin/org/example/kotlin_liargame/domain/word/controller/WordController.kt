package org.example.kotlin_liargame.domain.word.controller

import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
import org.example.kotlin_liargame.domain.word.dto.response.WordListResponse
import org.example.kotlin_liargame.domain.word.exception.ForbiddenWordException
import org.example.kotlin_liargame.domain.word.exception.SubjectNotFoundException
import org.example.kotlin_liargame.domain.word.exception.WordAlreadyExistsException
import org.example.kotlin_liargame.domain.word.service.WordService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/words")
class WordController (
    private val wordService: WordService
){
    @PostMapping("/applyw")
    fun applyWord(
        @RequestBody req : ApplyWordRequest
    ): ResponseEntity<Map<String, String>> {
        wordService.applyWord(req)
        return ResponseEntity.ok(mapOf("message" to "단어가 성공적으로 추가되었습니다."))
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

    @ExceptionHandler(SubjectNotFoundException::class)
    fun handleSubjectNotFoundException(e: SubjectNotFoundException): ResponseEntity<Map<String, String?>> {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(mapOf("message" to e.message))
    }

    @ExceptionHandler(WordAlreadyExistsException::class)
    fun handleWordAlreadyExistsException(e: WordAlreadyExistsException): ResponseEntity<Map<String, String?>> {
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(mapOf("message" to e.message))
    }

    @ExceptionHandler(ForbiddenWordException::class)
    fun handleForbiddenWordException(e: ForbiddenWordException): ResponseEntity<Map<String, String?>> {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(mapOf("message" to e.message))
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneralException(e: Exception): ResponseEntity<Map<String, String?>> {
        return ResponseEntity
            .badRequest()
            .body(mapOf("message" to "알 수 없는 오류가 발생했습니다."))
    }
}
