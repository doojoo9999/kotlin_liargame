package org.example.kotlin_liargame.domain.game.dto.response

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "게임 정리 작업 결과")
data class CleanupSummaryResponse(
    @Schema(description = "요청 성공 여부", example = "true")
    val success: Boolean,
    @Schema(description = "정리된 항목 수", example = "3")
    val cleanedCount: Int,
    @Schema(description = "상세 메시지", example = "Cleaned 3 orphaned games")
    val message: String
)

@Schema(description = "사용자 게임 데이터 정리 결과")
data class UserGameCleanupResponse(
    @Schema(description = "요청 성공 여부", example = "true")
    val success: Boolean,
    @Schema(description = "상세 메시지", example = "User game data cleaned up successfully")
    val message: String
)

@Schema(description = "관리자 게임 정리 결과")
data class ForceCleanupResponse(
    @Schema(description = "요청 성공 여부", example = "true")
    val success: Boolean,
    @Schema(description = "상세 메시지", example = "Game 100001 has been forcefully cleaned up")
    val message: String
)
