package org.example.kotlin_liargame.domain.subject.controller

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.dto.response.SubjectResponse
import org.example.kotlin_liargame.domain.subject.service.SubjectService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/subjects")
class SubjectController (
    private val subjectService: SubjectService
) {

    @PostMapping("/applysubj")
    fun applySubject(@RequestBody request: SubjectRequest): ResponseEntity<Any> {
        return try {
            val savedSubject = subjectService.applySubject(request)
            ResponseEntity.ok(mapOf(
                "success" to true,
                "id" to savedSubject.id,
                "name" to savedSubject.content
            ))
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(mapOf("error" to e.message))
        }
    }


    @DeleteMapping("/delsubj/{id}")
    fun deleteSubject(@RequestBody request: SubjectRequest) {
        subjectService.deleteSubject(request)
    }

    @GetMapping("/listsubj")
    fun subjectList(): List<SubjectResponse> {
        return subjectService.findAll()
    }

}
