package org.example.kotlin_liargame.domain.subject.controller

import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.subject.service.SubjectService
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping

@Controller
@RequestMapping("/api/v1/subjects")
class SubjectController (
    val subjectService: SubjectService
) {

    @PostMapping("/applysubj")
    fun applySubject(request: SubjectRequest) {
        subjectService.applySubject(request)
    }

    @DeleteMapping("/delsubj/{id}")
    fun deleteSubject(request: SubjectRequest) {
        subjectService.deleteSubject(request)
    }

    @GetMapping("/listsubj")
    fun subjectList(): List<SubjectEntity> {
        return subjectService.findAll()
    }

}