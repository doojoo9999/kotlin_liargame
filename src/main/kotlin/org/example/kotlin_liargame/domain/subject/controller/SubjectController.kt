package org.example.kotlin_liargame.domain.subject.controller

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.dto.response.SubjectApplyResponse
import org.example.kotlin_liargame.domain.subject.dto.response.SubjectResponse
import org.example.kotlin_liargame.domain.subject.exception.SubjectAlreadyExistsException
import org.example.kotlin_liargame.domain.subject.service.SubjectService
import org.example.kotlin_liargame.domain.word.exception.ForbiddenWordException
import org.example.kotlin_liargame.global.dto.ApiMessageResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/subjects")
class SubjectController (
    private val subjectService: SubjectService
) {

    @PostMapping("/applysubj")
    fun applySubject(@RequestBody request: SubjectRequest): ResponseEntity<SubjectApplyResponse> {
        val savedSubject = subjectService.applySubject(request)
        return ResponseEntity.ok(
            SubjectApplyResponse(
                success = true,
                id = savedSubject.id,
                name = savedSubject.content
            )
        )
    }

    @DeleteMapping("/delsubj/{id}")
    fun deleteSubject(@PathVariable id: Long): ResponseEntity<Void> {
        subjectService.deleteSubject(id)

        return ResponseEntity.noContent().build()
    }



    @GetMapping("/listsubj")
    fun subjectList(): List<SubjectResponse> {
        return subjectService.findAll()
    }

    @PostMapping("/approve-pending")
    fun approveAllPendingSubjects(): ResponseEntity<List<SubjectResponse>> {
        val approvedSubjects = subjectService.approveAllPendingSubjects()
        return ResponseEntity.ok(approvedSubjects)
    }

    @ExceptionHandler(SubjectAlreadyExistsException::class)
    fun handleSubjectAlreadyExistsException(e: SubjectAlreadyExistsException): ResponseEntity<ApiMessageResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiMessageResponse(success = false, message = e.message ?: "이미 등록된 주제입니다."))
    }

    @ExceptionHandler(ForbiddenWordException::class)
    fun handleForbiddenWordException(e: ForbiddenWordException): ResponseEntity<ApiMessageResponse> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiMessageResponse(success = false, message = e.message ?: "허용되지 않은 단어입니다."))
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneralException(e: Exception): ResponseEntity<ApiMessageResponse> {
        return ResponseEntity.badRequest()
            .body(ApiMessageResponse(success = false, message = "알 수 없는 오류가 발생했습니다.", details = mapOf("error" to (e.message ?: "unknown"))))
    }
}
