package org.example.kotlin_liargame.domain.image.dto

data class ImageUploadResponse(
    val url: String,
    val slug: String,
    val contentType: String,
    val size: Long
)
