package org.example.kotlin_liargame.domain.chat.dto.request

import org.example.kotlin_liargame.domain.chat.model.enum.ChatMessageType

class GetChatHistoryRequest(
    val gNumber: Int,
    val type: ChatMessageType? = null,
    val round: Int? = null,
    val limit: Int = 50
) {
    fun validate() {
        require(gNumber > 0) { "Game number must be positive" }
        require(limit in 1..100) { "Limit must be between 1 and 100" }
        if (round != null) {
            require(round > 0) { "Round must be positive" }
        }
    }
}
