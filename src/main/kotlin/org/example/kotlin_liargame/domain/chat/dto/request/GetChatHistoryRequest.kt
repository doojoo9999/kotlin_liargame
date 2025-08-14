package org.example.kotlin_liargame.domain.chat.dto.request

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Positive
import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType

data class GetChatHistoryRequest(
    @field:Positive(message = "게임 번호는 양수여야 합니다")
    val gameNumber: Int,
    
    val type: ChatMessageType? = null,
    
    @field:Positive(message = "라운드는 양수여야 합니다")
    val round: Int? = null,
    
    @field:Min(value = 1, message = "제한 개수는 최소 1개 이상이어야 합니다")
    @field:Max(value = 100, message = "제한 개수는 최대 100개 이하여야 합니다")
    val limit: Int = 50
)
