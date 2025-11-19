package org.example.kotlin_liargame.global.config

import io.github.cdimascio.dotenv.Dotenv
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration

@Configuration
class EnvConfig {
    private val logger = LoggerFactory.getLogger(this::class.java)
    
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
            
            logger.info("✅ .env 파일 로드 완료")
            logger.info("📊 로드된 환경변수: {}개", dotenv.entries().size)
        } catch (e: Exception) {
            logger.warn("⚠️ .env 파일 로드 실패: {}", e.message)
            logger.warn("🔍 현재 디렉토리: {}", System.getProperty("user.dir"))
        }
    }
}
