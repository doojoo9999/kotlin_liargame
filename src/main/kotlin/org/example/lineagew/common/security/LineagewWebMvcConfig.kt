package org.example.lineagew.common.security

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class LineagewWebMvcConfig(
    private val lineagewAdminInterceptor: LineagewAdminInterceptor
) : WebMvcConfigurer {

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(lineagewAdminInterceptor)
            .addPathPatterns("/api/lineage/**")
    }
}
