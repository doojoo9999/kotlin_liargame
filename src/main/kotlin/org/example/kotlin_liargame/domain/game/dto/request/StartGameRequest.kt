package org.example.kotlin_liargame.domain.game.dto.request

data class StartGameRequest(
    val subjectIds: List<Long>? = null,
    val useAllSubjects: Boolean = false,
    val useRandomSubjects: Boolean = true,
    val randomSubjectCount: Int? = 1
) {
    fun validate() {
        if (subjectIds != null) {
            if (subjectIds.isEmpty()) {
                throw IllegalArgumentException("주제 ID 목록???�공??경우 비어 ?�을 ???�습?�다")
            }
            
            subjectIds.forEach { subjectId ->
                if (subjectId <= 0) {
                    throw IllegalArgumentException("주제 ID???�수?�야 ?�니??)
                }
            }
            if (useAllSubjects || useRandomSubjects) {
                throw IllegalArgumentException("??번에 ?�나??주제 ?�택 방법�??�용?????�습?�다")
            }
        }

        if (useAllSubjects && useRandomSubjects) {
            throw IllegalArgumentException("??번에 ?�나??주제 ?�택 방법�??�용?????�습?�다")
        }
        
        if (useRandomSubjects && randomSubjectCount != null && randomSubjectCount <= 0) {
            throw IllegalArgumentException("?�덤?�로 ?�택??주제 ?�는 ?�수?�야 ?�니??)
        }
    }
}
