package org.example.kotlin_liargame.domain.image.controller

import jakarta.servlet.http.HttpServletRequest
import org.example.kotlin_liargame.domain.image.dto.ImageUploadResponse
import org.example.kotlin_liargame.domain.image.service.ImageStorageService
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.support.ServletUriComponentsBuilder

@RestController
class ImageController(
    private val imageStorageService: ImageStorageService
) {

    @PostMapping(
        value = ["/api/v1/images"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE]
    )
    fun uploadImage(
        @RequestParam("file") file: MultipartFile,
        request: HttpServletRequest
    ): ResponseEntity<ImageUploadResponse> {
        val stored = imageStorageService.storeImage(
            file = file,
            uploaderIp = extractClientIp(request),
            sessionId = request.getSession(false)?.id
        )

        val imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
            .path("/img/")
            .path(stored.slug)
            .toUriString()

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(
                ImageUploadResponse(
                    url = imageUrl,
                    slug = stored.slug,
                    contentType = stored.contentType,
                    size = stored.size
                )
            )
    }

    @GetMapping("/img/{slug}")
    fun renderImage(
        @PathVariable slug: String
    ): ResponseEntity<ByteArray> {
        val imageData = imageStorageService.loadImage(slug)

        val mediaType = runCatching { MediaType.parseMediaType(imageData.contentType) }
            .getOrDefault(MediaType.APPLICATION_OCTET_STREAM)

        return ResponseEntity.ok()
            .contentType(mediaType)
            .header(HttpHeaders.CONTENT_LENGTH, imageData.size.toString())
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
            .body(imageData.bytes)
    }

    private fun extractClientIp(request: HttpServletRequest): String? {
        val forwarded = request.getHeader("X-Forwarded-For")
        if (!forwarded.isNullOrBlank()) {
            return forwarded.split(',').first().trim()
        }
        return request.remoteAddr
    }
}
