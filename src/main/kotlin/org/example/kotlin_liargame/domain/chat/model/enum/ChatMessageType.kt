package org.example.kotlin_liargame.domain.chat.model.enum

enum class ChatMessageType {
    HINT,           // 힌트 단계에서의 메시지
    DISCUSSION,     // 토론 단계에서의 메시지
    DEFENSE,        // 변명 단계에서의 메시지
    POST_ROUND,     // 라운드 종료 후 채팅
    SYSTEM          // 시스템 메시지 (사회자, 게임 상태 알림 등)
}
