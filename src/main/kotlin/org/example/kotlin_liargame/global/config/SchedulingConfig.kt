package org.example.kotlin_liargame.global.config

import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.scheduling.annotation.EnableScheduling

@Configuration
@EnableScheduling
@Profile("!test") // 테스트 프로필에서는 스케줄링 비활성화
class SchedulingConfig
