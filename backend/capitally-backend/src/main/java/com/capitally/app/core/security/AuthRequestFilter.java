package com.capitally.app.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class AuthRequestFilter extends OncePerRequestFilter {
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");
    private final Set<String> allowedOrigins;
    private final Map<String, Window> attempts = new HashMap<>();

    public AuthRequestFilter(List<String> allowedOrigins) {
        this.allowedOrigins = Set.copyOf(allowedOrigins);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getServletPath().startsWith("/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Pragma", "no-cache");
        if (!SAFE_METHODS.contains(request.getMethod())) {
            // Custom headers require preflight; exact origins also reject hostile sibling subdomains.
            String origin = request.getHeader("Origin");
            if (!"1".equals(request.getHeader("X-Capitally-Request"))
                    || origin == null || !allowedOrigins.contains(origin)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN);
                return;
            }
            boolean refresh = request.getServletPath().equals("/auth/refresh")
                    || request.getServletPath().equals("/auth/logout");
            if (!allowRequest(request.getRemoteAddr() + (refresh ? ":session" : ":credentials"), refresh ? 120 : 20)) {
                response.setHeader("Retry-After", "60");
                response.sendError(429);
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private synchronized boolean allowRequest(String key, int limit) {
        long now = System.currentTimeMillis();
        attempts.entrySet().removeIf(entry -> now - entry.getValue().startedAt >= 60000);
        Window window = attempts.get(key);
        if (window == null) {
            if (attempts.size() >= 10000) return false;
            window = new Window(now);
            attempts.put(key, window);
        }
        return ++window.count <= limit;
    }

    private static final class Window {
        private final long startedAt;
        private int count;

        private Window(long startedAt) {
            this.startedAt = startedAt;
        }
    }
}
