package org.example.kotlin_liargame.domain.subject.controller

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.dto.response.SubjectResponse
import org.example.kotlin_liargame.domain.subject.exception.SubjectAlreadyExistsException
import org.example.kotlin_liargame.domain.subject.service.SubjectService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/subjects")
class SubjectController (
    private val subjectService: SubjectService
) {

    @PostMapping("/applysubj")
    fun applySubject(@RequestBody request: SubjectRequest): ResponseEntity<Any> {
        val savedSubject = subjectService.applySubject(request)
        return ResponseEntity.ok(mapOf(
            "success" to true,
            "id" to savedSubject.id,
            "name" to savedSubject.content
        ))
    }

    @DeleteMapping("/delsubj/{id}")
    fun deleteSubject(@RequestBody request: SubjectRequest) {
        subjectService.deleteSubject(request)
    }


    @GetMapping("/listsubj")
    fun subjectList(): List<SubjectResponse> {
        return subjectService.findAll()
    }

    @ExceptionHandler(SubjectAlreadyExistsException::class)
    fun handleSubjectAlreadyExistsException(e: SubjectAlreadyExistsException): ResponseEntity<Map<String, String?>> {
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(mapOf("message" to e.message))
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneralException(e: Exception): ResponseEntity<Map<String, String?>> {
        return ResponseEntity
            .badRequest()
            .body(mapOf("message" to "알 수 없는 오류가 발생했습니다."))
    }
}
