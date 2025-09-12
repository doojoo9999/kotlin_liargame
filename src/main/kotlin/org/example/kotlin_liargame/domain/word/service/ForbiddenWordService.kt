package org.example.kotlin_liargame.domain.word.service

import org.springframework.stereotype.Service

@Service
class ForbiddenWordService {

    // 금지된 단어 목록 (실제로는 데이터베이스나 설정 파일에서 관리할 수 있음)
    private val forbiddenWords = setOf(
        "욕설", "비속어", "금지어", // 예시 금지어들
        // 실제 서비스에서는 더 많은 금지어들을 추가
    )

    fun isForbidden(word: String): Boolean {
        val normalizedWord = word.trim().lowercase()
        return forbiddenWords.any { forbiddenWord ->
            normalizedWord.contains(forbiddenWord)
        }
    }

    fun validateWord(word: String) {
        if (isForbidden(word)) {
            throw org.example.kotlin_liargame.domain.word.exception.ForbiddenWordException(
                "사용이 금지된 단어입니다: '$word'"
            )
        }
    }
}
