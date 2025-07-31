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
                throw IllegalArgumentException("ì£¼ì œ ID ëª©ë¡???œê³µ??ê²½ìš° ë¹„ì–´ ?ˆì„ ???†ìŠµ?ˆë‹¤")
            }
            
            subjectIds.forEach { subjectId ->
                if (subjectId <= 0) {
                    throw IllegalArgumentException("ì£¼ì œ ID???‘ìˆ˜?¬ì•¼ ?©ë‹ˆ??)
                }
            }
            if (useAllSubjects || useRandomSubjects) {
                throw IllegalArgumentException("??ë²ˆì— ?˜ë‚˜??ì£¼ì œ ? íƒ ë°©ë²•ë§??¬ìš©?????ˆìŠµ?ˆë‹¤")
            }
        }

        if (useAllSubjects && useRandomSubjects) {
            throw IllegalArgumentException("??ë²ˆì— ?˜ë‚˜??ì£¼ì œ ? íƒ ë°©ë²•ë§??¬ìš©?????ˆìŠµ?ˆë‹¤")
        }
        
        if (useRandomSubjects && randomSubjectCount != null && randomSubjectCount <= 0) {
            throw IllegalArgumentException("?œë¤?¼ë¡œ ? íƒ??ì£¼ì œ ?˜ëŠ” ?‘ìˆ˜?¬ì•¼ ?©ë‹ˆ??)
        }
    }
}
