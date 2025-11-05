package org.example.kotlin_liargame.global.security

import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority

class SubjectAuthentication(
    private val subjectPrincipal: SubjectPrincipal
) : AbstractAuthenticationToken(subjectPrincipal.roles.toAuthorities()) {

    init {
        isAuthenticated = true
    }

    override fun getCredentials(): Any? = null

    override fun getPrincipal(): Any = subjectPrincipal

    companion object {
        private fun Set<String>.toAuthorities(): List<GrantedAuthority> =
            if (this.isEmpty()) {
                listOf(SimpleGrantedAuthority("ROLE_SUBJECT"))
            } else {
                this.map { SimpleGrantedAuthority(it) }
            }
    }
}

