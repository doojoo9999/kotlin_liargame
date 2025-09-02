package org.example.kotlin_liargame.global.config

import io.github.cdimascio.dotenv.Dotenv
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration

@Configuration
class EnvConfig {
    private val log = LoggerFactory.getLogger(EnvConfig::class.java)

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
            
            log.info(".env 로드 완료 ({} vars)", dotenv.entries().size)
        } catch (e: Exception) {
            log.warn(".env 로드 실패: {} (dir={})", e.message, System.getProperty("user.dir"))
        }
    }
}
