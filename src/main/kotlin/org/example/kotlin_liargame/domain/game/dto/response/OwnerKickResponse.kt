package org.example.kotlin_liargame.domain.game.dto.response

import io.swagger.v3.oas.annotations.media.Schema
import org.example.kotlin_liargame.domain.game.dto.GameFlowPayload

@Schema(description = "방장 강퇴 및 권한 이양 결과")
data class OwnerKickResponse(
    @Schema(description = "새로운 방장 닉네임", example = "citizen02")
    val newOwner: String,
    @Schema(description = "강퇴된 기존 방장", example = "host01")
    val kickedPlayer: String,
    @Schema(description = "게임 번호", example = "120034")
    val gameNumber: Int
) : GameFlowPayload

@Schema(description = "게임 시작 시간 연장 결과")
data class TimeExtensionResponse(
    @Schema(description = "연장된 시각", example = "2024-03-01T12:10:00Z")
    val extendedUntil: String,
    @Schema(description = "게임 번호", example = "120034")
    val gameNumber: Int
)
