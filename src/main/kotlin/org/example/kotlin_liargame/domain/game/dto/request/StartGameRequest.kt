package org.example.kotlin_liargame.domain.game.dto.request

import jakarta.validation.constraints.Positive
import org.example.kotlin_liargame.common.validation.ValidSubjectConfiguration

@ValidSubjectConfiguration
data class StartGameRequest(
    val subjectIds: List<@Positive(message = "주제 ID는 양수여야 합니다") Long>? = null,
    val useAllSubjects: Boolean = false,
    val useRandomSubjects: Boolean = true,

    @field:Positive(message = "랜덤으로 선택할 주제 수는 양수여야 합니다")
    val randomSubjectCount: Int? = 1
)
