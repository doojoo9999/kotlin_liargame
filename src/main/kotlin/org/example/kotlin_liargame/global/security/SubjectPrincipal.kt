package org.example.kotlin_liargame.global.security

import java.io.Serializable
import java.util.UUID

data class SubjectPrincipal(
    val subjectKey: UUID,
    val userId: Long? = null,
    val roles: Set<String> = emptySet()
) : Serializable {
    val isGuest: Boolean get() = userId == null
    val isAdmin: Boolean get() = roles.contains("ROLE_ADMIN")
}

