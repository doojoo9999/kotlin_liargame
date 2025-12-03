package org.example.kotlin_liargame.domain.image

import org.example.kotlin_liargame.domain.image.service.ImageStorageService
import org.junit.jupiter.api.Assertions.assertArrayEquals
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.ActiveProfiles
import org.springframework.web.server.ResponseStatusException

@SpringBootTest
@ActiveProfiles("test")
class ImageStorageServiceTest @Autowired constructor(
    private val imageStorageService: ImageStorageService
) {

    @Test
    fun `stores and loads image bytes`() {
        val content = ByteArray(256) { index -> (index % 128).toByte() }
        val multipartFile = MockMultipartFile(
            "file",
            "sample.png",
            "image/png",
            content
        )

        val stored = imageStorageService.storeImage(multipartFile, "127.0.0.1", "session-123")
        val loaded = imageStorageService.loadImage(stored.slug)

        assertEquals(stored.slug, loaded.slug)
        assertEquals("image/png", loaded.contentType)
        assertEquals(content.size.toLong(), loaded.size)
        assertArrayEquals(content, loaded.bytes)
    }

    @Test
    fun `rejects non image uploads`() {
        val multipartFile = MockMultipartFile(
            "file",
            "not-image.txt",
            "text/plain",
            "hello".toByteArray()
        )

        assertThrows(ResponseStatusException::class.java) {
            imageStorageService.storeImage(multipartFile, null, null)
        }
    }
}
