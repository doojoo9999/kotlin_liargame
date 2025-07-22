package org.example.kotlin_liargame.tools.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority

data class UserPrincipal (
    val userId: Long,
    val nickname: String,
    val authorities: Collection<GrantedAuthority>,
    val providerId: String
){
    constructor(userId: Long, nickname: String, roles: Set<String>, providerId: String) : this(
        userId,
        nickname,
        roles.map { SimpleGrantedAuthority("ROLE_$it") },
        providerId
    )
}