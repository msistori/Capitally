package com.capitally.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;

import java.util.List;

@Configuration
public class RolesTokenCustomizerConfig {

    @Bean
    OAuth2TokenCustomizer<JwtEncodingContext> rolesTokenCustomizer() {
        return context -> {
            var principal = context.getPrincipal();
            if (principal == null) return;

            List<String> roles = principal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(a -> a.startsWith("ROLE_"))
                    .map(a -> a.substring(5)) // es. ROLE_ADMIN -> ADMIN
                    .distinct()
                    .toList();

            if (!roles.isEmpty()) {
                context.getClaims().claim("roles", roles);
            }
        };
    }
}
