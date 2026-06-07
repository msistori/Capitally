package com.capitally.app.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

public class DemoWriteGuardFilter extends OncePerRequestFilter {
    private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private static final String DEMO_ROLE = "ROLE_DEMO";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/auth/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws IOException, jakarta.servlet.ServletException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (WRITE_METHODS.contains(request.getMethod()) && hasDemoRole(authentication)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "demo_write_forbidden");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean hasDemoRole(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> DEMO_ROLE.equals(authority.getAuthority()));
    }
}
