package org.example.kotlin_liargame.domain.word.controller

import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
import org.example.kotlin_liargame.domain.word.dto.response.WordListResponse
import org.example.kotlin_liargame.domain.word.exception.ForbiddenWordException
import org.example.kotlin_liargame.domain.word.exception.SubjectNotFoundException
import org.example.kotlin_liargame.domain.word.exception.WordAlreadyExistsException
import org.example.kotlin_liargame.domain.word.service.WordService
import org.example.kotlin_liargame.global.dto.ApiMessageResponse
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/words")
class WordController (
    private val wordService: WordService
){
    private val logger = LoggerFactory.getLogger(this::class.java)

    @PostMapping("/applyw")
    fun applyWord(
        @RequestBody req : ApplyWordRequest
    ): ResponseEntity<WordListResponse> {
        // 디버깅을 위한 요청 데이터 로깅
        logger.debug("=== Word Apply Request ===")
        logger.debug("Request data: {}", req)
        logger.debug("SubjectId: {}", req.subjectId)
        logger.debug("Word: {}", req.word)
        logger.debug("========================")
        
        val createdWord = wordService.applyWord(req)
        return ResponseEntity.ok(createdWord)
    }

    @DeleteMapping("/delw/{id}")
    fun deleteWord(
        @PathVariable id: Long
    ): ResponseEntity<Void> {
        wordService.removeWord(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/wlist")
    fun findAllWord(): List<WordListResponse> {
        return wordService.findAll()
    }

    @PostMapping("/approve-pending")
    fun approveAllPendingWords(): ResponseEntity<List<WordListResponse>> {
        val approvedWords = wordService.approveAllPendingWords()
        return ResponseEntity.ok(approvedWords)
    }

    @ExceptionHandler(SubjectNotFoundException::class)
    fun handleSubjectNotFoundException(e: SubjectNotFoundException): ResponseEntity<ApiMessageResponse> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiMessageResponse(success = false, message = e.message ?: "주제를 찾을 수 없습니다."))
    }

    @ExceptionHandler(WordAlreadyExistsException::class)
    fun handleWordAlreadyExistsException(e: WordAlreadyExistsException): ResponseEntity<ApiMessageResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiMessageResponse(success = false, message = e.message ?: "이미 등록된 단어입니다."))
    }

    @ExceptionHandler(ForbiddenWordException::class)
    fun handleForbiddenWordException(e: ForbiddenWordException): ResponseEntity<ApiMessageResponse> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiMessageResponse(success = false, message = e.message ?: "금지된 단어입니다."))
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneralException(e: Exception): ResponseEntity<ApiMessageResponse> {
        // 디버깅을 위한 상세 로깅 추가
        logger.error("=== Word Controller Exception ===")
        logger.error("Exception type: {}", e.javaClass.simpleName)
        logger.error("Exception message: {}", e.message)
        logger.error("Stack trace: ", e)
        logger.error("================================")
        
        return ResponseEntity.badRequest()
            .body(ApiMessageResponse(success = false, message = "알 수 없는 오류가 발생했습니다.", details = mapOf("error" to (e.message ?: "unknown"))))
    }
}
