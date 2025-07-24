package org.example.kotlin_liargame.domain.game.dto.request

data class StartGameRequest(
    val subjectIds: List<Long>? = null,
    val useAllSubjects: Boolean = false,
    val useRandomSubjects: Boolean = false,
    val randomSubjectCount: Int? = null
) {
    fun validate() {
        if (subjectIds != null) {
            if (subjectIds.isEmpty()) {
                throw IllegalArgumentException("주제 ID 목록이 제공된 경우 비어 있을 수 없습니다")
            }
            
            subjectIds.forEach { subjectId ->
                if (subjectId <= 0) {
                    throw IllegalArgumentException("주제 ID는 양수여야 합니다")
                }
            }
        }
        
        val selectionMethods = listOf(
            subjectIds != null,
            useAllSubjects,
            useRandomSubjects
        ).count { it }
        
        if (selectionMethods > 1) {
            throw IllegalArgumentException("한 번에 하나의 주제 선택 방법만 사용할 수 있습니다")
        }
        
        if (selectionMethods == 0) {
            throw IllegalArgumentException("적어도 하나의 주제 선택 방법을 지정해야 합니다")
        }
        if (useRandomSubjects && randomSubjectCount != null && randomSubjectCount <= 0) {
            throw IllegalArgumentException("무작위 주제 수는 양수여야 합니다")
        }
    }
}