package com.capitally.app.controller;

import com.capitally.app.core.security.UserPrincipal;
import com.capitally.app.model.request.ForgotPasswordRequestDTO;
import com.capitally.app.model.request.LoginRequestDTO;
import com.capitally.app.model.request.RegisterRequestDTO;
import com.capitally.app.model.response.AuthResponseDTO;
import com.capitally.app.model.response.MeResponseDTO;
import com.capitally.app.service.AuthService;
import com.capitally.app.service.AuthSessionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication and persistent sessions")
public class AuthController {
    private final AuthService authService;
    private final AuthSessionService sessions;

    @Value("${auth.secure-cookie:true}")
    private boolean secureCookie;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO req,
            HttpServletRequest request, HttpServletResponse response) {
        var issued = authService.login(req);
        sessions.logout(refreshCookie(request), bearer(request));
        return respond(issued, response);
    }

    @PostMapping("/guest-login")
    public ResponseEntity<AuthResponseDTO> guestLogin(HttpServletRequest request, HttpServletResponse response) {
        var issued = authService.guestLogin();
        sessions.logout(refreshCookie(request), bearer(request));
        return respond(issued, response);
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegisterRequestDTO req) {
        authService.register(req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequestDTO req) {
        authService.forgotPassword(req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refresh(HttpServletRequest request, HttpServletResponse response) {
        return respond(sessions.refresh(refreshCookie(request)), response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        sessions.logout(refreshCookie(request), bearer(request));
        setRefreshCookie(response, "", Duration.ZERO);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponseDTO> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.me(principal));
    }

    private ResponseEntity<AuthResponseDTO> respond(AuthSessionService.IssuedSession issued, HttpServletResponse response) {
        if (issued == null) {
            setRefreshCookie(response, "", Duration.ZERO);
            return ResponseEntity.status(401).build();
        }
        String token = issued.refreshToken();
        setRefreshCookie(response, token == null ? "" : token,
                token == null ? Duration.ZERO : Duration.between(Instant.now(), issued.expiresAt()));
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(issued.response());
    }

    private void setRefreshCookie(HttpServletResponse response, String value, Duration maxAge) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(cookieName(), value)
                .httpOnly(true).secure(secureCookie).sameSite("Strict").path("/")
                .maxAge(maxAge.isNegative() ? Duration.ZERO : maxAge).build().toString());
    }

    private String cookieName() {
        return secureCookie ? "__Host-cap_refresh" : "cap_refresh_dev";
    }

    private String refreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        String value = null;
        for (var cookie : request.getCookies()) {
            if (cookieName().equals(cookie.getName())) {
                if (value != null) return null;
                value = cookie.getValue();
            }
        }
        return value;
    }

    private String bearer(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        return header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
    }
}
