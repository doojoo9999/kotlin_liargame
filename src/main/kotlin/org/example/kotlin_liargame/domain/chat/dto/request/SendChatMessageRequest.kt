package org.example.kotlin_liargame.domain.chat.dto.request

class SendChatMessageRequest(
    val gNumber: Int,
    val content: String
) {
    fun validate() {
        require(gNumber > 0) { "Game number must be positive" }
        require(content.isNotBlank()) { "Message content cannot be empty" }
        require(content.length <= 500) { "Message content cannot exceed 500 characters" }
    }
}