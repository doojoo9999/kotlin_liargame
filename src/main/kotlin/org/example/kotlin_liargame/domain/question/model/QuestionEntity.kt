package org.example.kotlin_liargame.domain.question.model

import com.fasterxml.jackson.annotation.JsonBackReference
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity

@Entity
@Table(name = "question")
class QuestionEntity (

    val question : String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    var subject: SubjectEntity ?= null
) {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    val id: Long = 0
}
