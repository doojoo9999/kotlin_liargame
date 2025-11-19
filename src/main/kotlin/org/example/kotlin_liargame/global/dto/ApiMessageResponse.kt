package org.example.kotlin_liargame.global.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "단순 메시지 응답")
data class ApiMessageResponse(
    @Schema(description = "성공 여부", example = "true")
    val success: Boolean,
    @Schema(description = "메시지", example = "요청이 처리되었습니다.")
    val message: String,
    @Schema(description = "추가 세부 정보", nullable = true)
    val details: Map<String, Any?>? = null
)
