package org.example.kotlin_liargame.domain.chat.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

data class SendChatMessageRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,
    
    @field:NotBlank(message = "메시지 내용은 필수입니다")
    @field:Size(min = 1, max = 500, message = "메시지는 1자 이상 500자 이하여야 합니다")
    val content: String,

    @field:Size(max = 50, message = "플레이어 닉네임은 50자 이하여야 합니다")
    val playerNickname: String? = null
) {
    fun getSanitizedContent(): String {
        return content.trim()
            .replace(Regex("<script[^>]*>.*?</script>", RegexOption.IGNORE_CASE), "") // 스크립트 태그 제거
            .replace(Regex("<[^>]+>"), "") // HTML 태그 제거
            .replace(Regex("javascript:", RegexOption.IGNORE_CASE), "") // JavaScript 프로토콜 제거
            .replace(Regex("on\\w+\\s*=", RegexOption.IGNORE_CASE), "") // 이벤트 핸들러 제거
    }
    
    fun isValidLength(): Boolean {
        return content.length <= 500
    }
}
