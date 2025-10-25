package org.example.lineagew.presentation

import jakarta.validation.Valid
import org.example.lineagew.application.dto.UploadCommitResponse
import org.example.lineagew.application.dto.UploadPayload
import org.example.lineagew.application.dto.UploadPreviewResponse
import org.example.lineagew.application.service.UploadService
import org.example.lineagew.common.security.LineagewAdminOnly
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lineage/upload")
@Validated
class UploadController(
    private val uploadService: UploadService
) {

    @LineagewAdminOnly
    @PostMapping("/preview")
    fun preview(@Valid @RequestBody payload: UploadPayload): UploadPreviewResponse =
        uploadService.preview(payload)

    @LineagewAdminOnly
    @PostMapping("/commit")
    @ResponseStatus(HttpStatus.CREATED)
    fun commit(@Valid @RequestBody payload: UploadPayload): UploadCommitResponse =
        uploadService.commit(payload)
}
