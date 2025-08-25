package org.example.kotlin_liargame.domain.auth.dto.response

data class PendingSubjectInfo(
    val id: Long,
    val content: String
)

data class PendingWordInfo(
    val id: Long,
    val content: String,
    val subject: String
)

data class PendingContentResponse(
    val pendingSubjects: List<PendingSubjectInfo>,
    val pendingWords: List<PendingWordInfo>
)
