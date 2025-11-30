package com.capitally.app.core.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.*;

@Configuration
public class OAuth2UserConfig {

    @Bean
    OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
        OidcUserService delegate = new OidcUserService();
        return req -> {
            OidcUser user = delegate.loadUser(req);
            Set<GrantedAuthority> auth = new HashSet<>(user.getAuthorities());

            List<String> roles = Optional.ofNullable(user.getClaimAsStringList("roles"))
                    .orElseGet(List::of);
            for (String r : roles) {
                if (r != null && !r.isBlank()) {
                    auth.add(new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()));
                }
            }

            String single = user.getClaimAsString("role"); // fallback se un giorno mandi un singolo "role"
            if (single != null && !single.isBlank()) {
                auth.add(new SimpleGrantedAuthority("ROLE_" + single.toUpperCase()));
            }

            return new DefaultOidcUser(auth, user.getIdToken(), user.getUserInfo());
        };
    }
}
