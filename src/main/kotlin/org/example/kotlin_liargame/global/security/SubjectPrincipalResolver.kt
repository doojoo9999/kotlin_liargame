package org.example.kotlin_liargame.global.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseCookie
import org.springframework.stereotype.Component
import java.time.Duration
import java.util.UUID

@Component
class SubjectPrincipalResolver(
    private val sessionManagementService: SessionManagementService
) {

    fun resolveOrCreate(request: HttpServletRequest, response: HttpServletResponse): SubjectPrincipal {
        val session = request.getSession(true)
        val cached = session.getAttribute(SUBJECT_SESSION_ATTRIBUTE) as? SubjectPrincipal
        if (cached != null) {
            request.setAttribute(REQUEST_ATTRIBUTE, cached)
            return cached
        }

        val userId = sessionManagementService.getCurrentUserId(session)
        val isAdmin = sessionManagementService.isAdmin(session)
        val subjectKey = when {
            userId != null -> deterministicUserSubject(userId)
            else -> resolveGuestSubjectKey(request) ?: UUID.randomUUID()
        }

        val roles = buildSet {
            add("ROLE_SUBJECT")
            if (userId != null) {
                add("ROLE_USER")
            } else {
                add("ROLE_GUEST")
            }
            if (isAdmin) {
                add("ROLE_ADMIN")
            }
        }

        val principal = SubjectPrincipal(
            subjectKey = subjectKey,
            userId = userId,
            roles = roles
        )

        session.setAttribute(SUBJECT_SESSION_ATTRIBUTE, principal)
        request.setAttribute(REQUEST_ATTRIBUTE, principal)

        if (principal.isGuest) {
            ensureGuestCookie(request, response, subjectKey)
        }

        return principal
    }

    fun getCurrentPrincipal(request: HttpServletRequest): SubjectPrincipal? =
        request.getAttribute(REQUEST_ATTRIBUTE) as? SubjectPrincipal

    private fun deterministicUserSubject(userId: Long): UUID =
        UUID.nameUUIDFromBytes("user:$userId".toByteArray())

    private fun resolveGuestSubjectKey(request: HttpServletRequest): UUID? {
        val cookieValue = request.cookies
            ?.firstOrNull { it.name == SUBJECT_COOKIE_NAME }
            ?.value
            ?.takeIf { it.isNotBlank() }

        val headerValue = request.getHeader(LEGACY_SUBJECT_HEADER)?.takeIf { it.isNotBlank() }

        return listOfNotNull(cookieValue, headerValue)
            .firstNotNullOfOrNull { raw ->
                runCatching { UUID.fromString(raw.trim()) }.getOrNull()
            }
    }

    private fun ensureGuestCookie(
        request: HttpServletRequest,
        response: HttpServletResponse,
        subjectKey: UUID
    ) {
        val existing = request.cookies?.any { it.name == SUBJECT_COOKIE_NAME } ?: false
        if (existing) {
            // refresh cookie to extend expiry
            addSubjectCookie(response, subjectKey, request.isSecure)
        } else {
            addSubjectCookie(response, subjectKey, request.isSecure)
        }
    }

    private fun addSubjectCookie(
        response: HttpServletResponse,
        subjectKey: UUID,
        secure: Boolean
    ) {
        val cookie = ResponseCookie.from(SUBJECT_COOKIE_NAME, subjectKey.toString())
            .httpOnly(true)
            .secure(secure)
            .path("/")
            .maxAge(Duration.ofDays(365))
            .sameSite("Lax")
            .build()
        response.addHeader("Set-Cookie", cookie.toString())
    }

    companion object {
        const val SUBJECT_COOKIE_NAME = "nemonemo_subject"
        const val LEGACY_SUBJECT_HEADER = "X-Subject-Key"
        const val SUBJECT_SESSION_ATTRIBUTE = "nemonemo_subject_principal"
        const val REQUEST_ATTRIBUTE = "nemonemo.subjectPrincipal"
    }
}
