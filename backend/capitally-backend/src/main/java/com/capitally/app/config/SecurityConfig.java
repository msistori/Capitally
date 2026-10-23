package com.capitally.app.config;

import com.capitally.app.core.security.JwtAuthenticationFilter;
import com.capitally.app.core.security.DemoWriteGuardFilter;
import com.capitally.app.core.security.JwtTokenProvider;
import com.capitally.app.core.security.AuthRequestFilter;
import com.capitally.app.service.AuthSessionService;
import org.springframework.scheduling.annotation.EnableScheduling;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;
import java.net.URI;
import jakarta.annotation.PostConstruct;

@Configuration
@EnableScheduling
public class SecurityConfig {

    @Value("${auth.allowed-origins}")
    private List<String> allowedOrigins;

    @PostConstruct
    void validateAllowedOrigins() {
        if (allowedOrigins.isEmpty()) throw new IllegalArgumentException("At least one authentication origin is required");
        for (String origin : allowedOrigins) {
            URI uri = URI.create(origin);
            if (!("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))
                    || uri.getHost() == null || uri.getRawUserInfo() != null
                    || !uri.getRawPath().isEmpty() || uri.getRawQuery() != null || uri.getRawFragment() != null) {
                throw new IllegalArgumentException("Authentication origins must be exact HTTP(S) origins without paths");
            }
        }
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public JwtTokenProvider jwtTokenProvider(@Value("${jwt.secret}") String secret,
                                             @Value("${jwt.validityMillis:900000}") long validity) {
        return new JwtTokenProvider(secret, validity);
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService uds, PasswordEncoder pe) {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(uds);
        p.setPasswordEncoder(pe);
        return new ProviderManager(p);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtTokenProvider jwt, AuthSessionService sessions) throws Exception {
        // Bearer APIs do not use cookies; AuthRequestFilter protects every cookie/auth mutation.
        http.csrf(csrf -> csrf.disable());
        http.cors(Customizer.withDefaults());
        http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.requestCache(rc -> rc.disable());
        http.exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                .accessDeniedHandler((req, res, e) -> res.sendError(HttpServletResponse.SC_FORBIDDEN))
        );
        http.authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                        "/auth/login", "/auth/register", "/auth/guest-login", "/auth/forgot-password",
                        "/auth/refresh", "/auth/logout",
                        "/analytics/config",
                        "/api/analytics/config",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/swagger-resources/**",
                        "/webjars/**",
                        "/error",
                        "/",
                        "/index.html",
                        "/assets/**",
                        "/*.js",
                        "/*.css",
                        "/*.ico",
                        "/*.map",
                        "/manifest.webmanifest",
                        "/ngsw-worker.js",
                        "/ngsw.json",
                        "/safety-worker.js",
                        "/worker-basic.min.js",
                        "/.well-known/**",
                        "/robots.txt",
                        "/sitemap.xml",
                        "/favicon.ico",
                        "/it/**",
                        "/en/**",
                        "/app/**"
                ).permitAll()
                .anyRequest().authenticated()
        );
        http.addFilterBefore(new JwtAuthenticationFilter(jwt, sessions),
                UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(new AuthRequestFilter(allowedOrigins), JwtAuthenticationFilter.class);
        http.addFilterAfter(new DemoWriteGuardFilter(), JwtAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(allowedOrigins);
        c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS","HEAD"));
        c.setAllowedHeaders(List.of("Authorization","Content-Type","Accept","Accept-Language","X-Analytics-Consent","X-Capitally-Request"));
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", c);
        return src;
    }
}
