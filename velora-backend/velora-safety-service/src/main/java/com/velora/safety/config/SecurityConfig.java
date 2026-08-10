package com.velora.safety.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final GatewayHeaderAuthFilter filter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers("/actuator/**", "/v3/api-docs/**", "/swagger-ui/**").permitAll().anyRequest().authenticated())
                .addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Component
    public static class GatewayHeaderAuthFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest req, @NonNull HttpServletResponse res, @NonNull FilterChain chain) throws ServletException, IOException {
            String userId = req.getHeader("X-Velora-User-Id");
            if (!StringUtils.hasText(userId)) {
                userId = req.getHeader("X-User-Id");
            }
            String role = req.getHeader("X-Velora-User-Role");
            if (!StringUtils.hasText(role)) {
                role = req.getHeader("X-User-Role");
            }
            String email = req.getHeader("X-Velora-User-Email");
            if (!StringUtils.hasText(email)) {
                email = req.getHeader("X-User-Email");
            }

            String effectiveRole = StringUtils.hasText(role) ? role : "ROLE_USER";
            if (!effectiveRole.startsWith("ROLE_")) {
                effectiveRole = "ROLE_" + effectiveRole;
            }
            String principal = StringUtils.hasText(email) ? email : (StringUtils.hasText(userId) ? "user@" + userId : "user@velora.app");
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(principal, null, List.of(new SimpleGrantedAuthority(effectiveRole)))
            );
            chain.doFilter(req, res);
        }
    }

    public SecurityConfig(final GatewayHeaderAuthFilter filter) {
        this.filter = filter;
    }
}
