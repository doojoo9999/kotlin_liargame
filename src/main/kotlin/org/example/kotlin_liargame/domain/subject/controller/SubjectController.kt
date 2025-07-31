package org.example.kotlin_liargame.domain.subject.controller

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.dto.response.SubjectResponse
import org.example.kotlin_liargame.domain.subject.service.SubjectService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/subjects")
class SubjectController (
    private val subjectService: SubjectService
) {

    @PostMapping("/applysubj")
    fun applySubject(@RequestBody request: SubjectRequest) {
        subjectService.applySubject(request)
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
