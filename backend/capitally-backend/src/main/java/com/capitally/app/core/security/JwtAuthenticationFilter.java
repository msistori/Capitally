package com.capitally.app.core.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.math.BigInteger;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwt;

    public JwtAuthenticationFilter(JwtTokenProvider jwt) {
        this.jwt = jwt;
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    private boolean validate(String token) {
        try {
            jwt.parse(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws IOException, jakarta.servlet.ServletException {

        String token = resolveToken(request);

        if (token != null && validate(token)) {
            Claims claims = jwt.parse(token);

            String username = claims.getSubject();

            String idStr = claims.getId();
            BigInteger userId = null;
            if (idStr != null) {
                try {
                    userId = new BigInteger(idStr);
                } catch (Exception ignored) {}
            }

            String rolesStr = claims.get("roles", String.class);
            List<String> roles = rolesStr != null
                    ? List.of(rolesStr.split(","))
                    : List.of();

            Collection<SimpleGrantedAuthority> authorities =
                    roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).collect(Collectors.toList());

            UserPrincipal principal =
                    new UserPrincipal(userId, username, "", authorities, true);

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(principal, token, authorities);

            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        chain.doFilter(request, response);
    }
}
