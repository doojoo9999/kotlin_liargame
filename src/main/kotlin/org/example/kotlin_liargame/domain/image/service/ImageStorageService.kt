package org.example.kotlin_liargame.domain.image.service

import org.example.kotlin_liargame.domain.image.model.StoredImageEntity
import org.example.kotlin_liargame.domain.image.repository.StoredImageRepository
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.security.SecureRandom

@Service
class ImageStorageService(
    private val storedImageRepository: StoredImageRepository
) {

    companion object {
        private const val SLUG_LENGTH = 12
        private const val MAX_GENERATION_ATTEMPTS = 8
        private const val MAX_IMAGE_SIZE_BYTES: Long = 5 * 1024 * 1024 // 5MB safeguard
        private val SLUG_PATTERN = Regex("^[A-Za-z0-9]{6,32}$")
        private const val ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        private val EXTENSION_CONTENT_TYPES = mapOf(
            "jpg" to "image/jpeg",
            "jpeg" to "image/jpeg",
            "png" to "image/png",
            "gif" to "image/gif",
            "webp" to "image/webp",
            "bmp" to "image/bmp",
            "avif" to "image/avif"
        )
    }

    data class StoredImageMetadata(
        val slug: String,
        val contentType: String,
        val size: Long
    )

    data class ImageData(
        val slug: String,
        val contentType: String,
        val size: Long,
        val bytes: ByteArray
    )

    private val random = SecureRandom()

    @Transactional
    fun storeImage(file: MultipartFile, uploaderIp: String?, sessionId: String?): StoredImageMetadata {
        if (file.isEmpty) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "빈 파일은 업로드할 수 없습니다.")
        }

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            throw ResponseStatusException(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "이미지 크기는 최대 ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB까지만 허용됩니다."
            )
        }

        val contentType = resolveContentType(file)
        if (!contentType.startsWith("image/")) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이미지 파일만 업로드할 수 있습니다.")
        }

        val slug = generateSlug()
        val safeFilename = file.originalFilename?.take(255)

        val entity = StoredImageEntity(
            slug = slug,
            contentType = contentType,
            size = file.size,
            data = file.bytes,
            originalFilename = safeFilename,
            uploaderIp = uploaderIp?.take(40),
            uploaderSessionId = sessionId?.take(100)
        )

        storedImageRepository.save(entity)

        return StoredImageMetadata(
            slug = slug,
            contentType = contentType,
            size = file.size
        )
    }

    @Transactional(readOnly = true)
    fun loadImage(slug: String): ImageData {
        val normalizedSlug = slug.trim()

        if (!SLUG_PATTERN.matches(normalizedSlug)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "유효하지 않은 이미지 경로입니다.")
        }

        val entity = storedImageRepository.findBySlug(normalizedSlug)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "이미지를 찾을 수 없습니다.")

        return ImageData(
            slug = entity.slug,
            contentType = entity.contentType,
            size = entity.size,
            bytes = entity.data
        )
    }

    private fun resolveContentType(file: MultipartFile): String {
        val headerType = file.contentType?.takeIf { it.isNotBlank() }
        if (headerType != null && headerType.startsWith("image/")) {
            return headerType
        }

        val extension = file.originalFilename
            ?.substringAfterLast('.', "")
            ?.lowercase()
            ?.takeIf { it.isNotBlank() }

        val extensionType = extension?.let { EXTENSION_CONTENT_TYPES[it] }

        return extensionType
            ?: headerType
            ?: MediaType.APPLICATION_OCTET_STREAM_VALUE
    }

    private fun generateSlug(): String {
        repeat(MAX_GENERATION_ATTEMPTS) {
            val candidate = buildString(SLUG_LENGTH) {
                repeat(SLUG_LENGTH) {
                    append(ALPHABET[random.nextInt(ALPHABET.length)])
                }
            }

            if (!storedImageRepository.existsBySlug(candidate)) {
                return candidate
            }
        }

        throw ResponseStatusException(
            HttpStatus.SERVICE_UNAVAILABLE,
            "새 이미지 주소를 생성하지 못했습니다. 잠시 후 다시 시도해주세요."
        )
    }
}
