package org.example.kotlin_liargame.domain.auth.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class LoginRequest (
    @field:NotBlank(message = "닉네임은 필수입니다")
    @field:Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다")
    @field:Pattern(
        regexp = "^[가-힣a-zA-Z0-9_-]+$",
        message = "닉네임은 한글, 영문, 숫자, 언더스코어, 하이픈만 사용 가능합니다"
    )
    val nickname : String,
    
    @field:Size(max = 100, message = "비밀번호는 100자 이하여야 합니다")
    val password : String? = null
) {
    fun getSanitizedNickname(): String {
        return nickname.trim()
            .replace(Regex("[<>\"'&]"), "") // XSS 방지를 위한 기본 문자 제거
    }
}
