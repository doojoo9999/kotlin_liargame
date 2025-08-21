package org.example.kotlin_liargame.domain.profanity.model

import jakarta.persistence.*
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "profanity")
class ProfanityEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, unique = true)
    val word: String
) : BaseEntity()
