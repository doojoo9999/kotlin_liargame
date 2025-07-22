package org.example.kotlin_liargame.domain.subject.model

import com.fasterxml.jackson.annotation.JsonManagedReference
import jakarta.persistence.*
import org.example.kotlin_liargame.domain.question.model.QuestionEntity

@Entity
@Table(name = "subject")
class SubjectEntity (
    val content : String,

    @OneToMany(mappedBy = "subject", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    val question: List<QuestionEntity>,

    val createdUser: String
){
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}