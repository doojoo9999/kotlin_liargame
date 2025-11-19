package org.example.kotlin_liargame.domain.auth.dto.response

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "로그아웃 처리 결과")
data class LogoutResponseDto(
    @Schema(description = "요청 성공 여부", example = "true")
    val success: Boolean = true
)

@Schema(description = "세션 갱신 결과")
data class SessionRefreshResponse(
    @Schema(description = "요청 성공 여부", example = "true")
    val success: Boolean,
    @Schema(description = "사용자 ID", example = "12", nullable = true)
    val userId: Long?,
    @Schema(description = "닉네임", example = "liarMaster", nullable = true)
    val nickname: String?,
    @Schema(description = "상세 메시지", example = "세션이 갱신되었습니다.")
    val message: String
)

@Schema(description = "인증 상태 응답")
data class AuthCheckResponse(
    @Schema(description = "인증 여부", example = "true")
    val authenticated: Boolean,
    @Schema(description = "사용자 ID", example = "34", nullable = true)
    val userId: Long?,
    @Schema(description = "닉네임", example = "citizen001", nullable = true)
    val nickname: String?
)
