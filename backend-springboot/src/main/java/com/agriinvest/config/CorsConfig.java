package com.agriinvest.config;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.agriinvest.security.AuthTokenInterceptor;

@Configuration
public class CorsConfig {

    private static final List<String> DEFAULT_ALLOWED_ORIGIN_PATTERNS = List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://*.onrender.com"
    );

    private final AuthTokenInterceptor authTokenInterceptor;
    private final List<String> allowedOriginPatterns;

    public CorsConfig(
            AuthTokenInterceptor authTokenInterceptor,
            @Value("${app.cors.allowed-origins:}") String configuredOrigins
    ) {
        this.authTokenInterceptor = authTokenInterceptor;
        this.allowedOriginPatterns = mergeAllowedOrigins(configuredOrigins);
    }

    @Bean
    public WebMvcConfigurer webMvcConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns(allowedOriginPatterns.toArray(String[]::new))
                        .allowCredentials(true)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .maxAge(3600);
            }

            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(authTokenInterceptor)
                        .addPathPatterns("/api/**");
            }
        };
    }

    private List<String> mergeAllowedOrigins(String configuredOrigins) {
        Set<String> merged = new LinkedHashSet<>(DEFAULT_ALLOWED_ORIGIN_PATTERNS);
        for (String origin : splitOrigins(configuredOrigins)) {
            merged.add(origin);
        }
        return new ArrayList<>(merged);
    }

    private List<String> splitOrigins(String configuredOrigins) {
        if (configuredOrigins == null || configuredOrigins.isBlank()) {
            return List.of();
        }

        String[] parts = configuredOrigins.split(",");
        List<String> origins = new ArrayList<>();
        for (String part : parts) {
            String normalized = part == null ? "" : part.trim();
            if (!normalized.isBlank()) {
                origins.add(normalized);
            }
        }
        return origins;
    }
}
