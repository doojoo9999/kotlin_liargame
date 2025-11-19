package org.example.kotlin_liargame.domain.subject.dto.response

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "주제 신청 결과")
data class SubjectApplyResponse(
    @Schema(description = "성공 여부", example = "true")
    val success: Boolean,
    @Schema(description = "신청된 주제 ID", example = "12")
    val id: Long,
    @Schema(description = "주제 이름", example = "과일")
    val name: String
)
