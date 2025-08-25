package org.example.kotlin_liargame.global.config

import io.github.cdimascio.dotenv.Dotenv
import jakarta.annotation.PostConstruct
import org.springframework.context.annotation.Configuration

@Configuration
class EnvConfig {

    @PostConstruct
    fun loadEnv() {
        try {
            val dotenv = Dotenv.configure()
                .directory(".")
                .filename(".env")
                .load()

            // 환경변수들을 시스템 프로퍼티로 설정
            dotenv.entries().forEach { entry ->
                System.setProperty(entry.key, entry.value)
            }

            println("✅ .env 파일 로드 완료")
            println("📊 로드된 환경변수: ${dotenv.entries().size}개")
        } catch (e: Exception) {
            println("⚠️ .env 파일 로드 실패: ${e.message}")
            println("🔍 현재 디렉토리: ${System.getProperty("user.dir")}")
        }
    }
}
