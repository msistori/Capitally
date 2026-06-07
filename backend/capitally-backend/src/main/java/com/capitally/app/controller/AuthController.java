package com.capitally.app.controller;

import com.capitally.app.model.request.ForgotPasswordRequestDTO;
import com.capitally.app.model.request.LoginRequestDTO;
import com.capitally.app.model.request.RegisterRequestDTO;
import com.capitally.app.model.response.AuthResponseDTO;
import com.capitally.app.model.response.MeResponseDTO;
import com.capitally.app.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "API di Autenticazione")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/guest-login")
    public ResponseEntity<AuthResponseDTO> guestLogin() {
        return ResponseEntity.ok(authService.guestLogin());
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<AuthResponseDTO> register(@RequestBody RegisterRequestDTO req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequestDTO req) {
        authService.forgotPassword(req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponseDTO> me(@RequestHeader("Authorization") String header) {
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        if (token == null) return ResponseEntity.status(401).build();

        return ResponseEntity.ok(authService.me(token));
    }
}
