package org.example.kotlin_liargame.domain.game.dto.request

data class StartGameRequest(
    val gNumber: Int,
    val subjectIds: List<Long>? = null,
    val useAllSubjects: Boolean = false,
    val useRandomSubjects: Boolean = false,
    val randomSubjectCount: Int? = null
) {
    fun validate() {
        if (gNumber <= 0) {
            throw IllegalArgumentException("Game number must be positive")
        }
        
        if (subjectIds != null) {
            if (subjectIds.isEmpty()) {
                throw IllegalArgumentException("Subject IDs list cannot be empty if provided")
            }
            
            subjectIds.forEach { subjectId ->
                if (subjectId <= 0) {
                    throw IllegalArgumentException("Subject ID must be positive")
                }
            }
        }
        
        val selectionMethods = listOf(
            subjectIds != null,
            useAllSubjects,
            useRandomSubjects
        ).count { it }
        
        if (selectionMethods > 1) {
            throw IllegalArgumentException("Only one subject selection method can be used at a time")
        }
        
        if (selectionMethods == 0) {
            throw IllegalArgumentException("At least one subject selection method must be specified")
        }
        if (useRandomSubjects && randomSubjectCount != null && randomSubjectCount <= 0) {
            throw IllegalArgumentException("Random subject count must be positive")
        }
    }
}