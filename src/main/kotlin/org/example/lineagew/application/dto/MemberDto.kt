package org.example.lineagew.application.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.example.lineagew.common.MemberRole
import org.example.lineagew.common.MemberStatus
import org.example.lineagew.domain.member.Member
import java.time.LocalDate

data class MemberCreateRequest(
    @field:NotBlank
    @field:Size(max = 80)
    val name: String,

    val joinedAt: LocalDate? = null,
    val role: MemberRole = MemberRole.USER,
    val memo: String? = null
)

data class MemberUpdateRequest(
    @field:Size(max = 80)
    val name: String? = null,
    val status: MemberStatus? = null,
    val role: MemberRole? = null,
    val joinedAt: LocalDate? = null,
    val memo: String? = null
)

data class MemberResponse(
    val id: Long,
    val name: String,
    val status: MemberStatus,
    val role: MemberRole,
    val joinedAt: LocalDate?,
    val lastActiveAt: LocalDate?,
    val memo: String?
)

fun Member.toResponse(): MemberResponse = MemberResponse(
    id = requireNotNull(id),
    name = name,
    status = status,
    role = role,
    joinedAt = joinedAt,
    lastActiveAt = lastActiveAt,
    memo = memo
)
