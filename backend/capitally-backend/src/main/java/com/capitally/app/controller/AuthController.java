package com.capitally.app.controller;

import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.enums.UserRoleEnum;
import com.capitally.app.core.repository.UserRepository;
import com.capitally.app.model.request.LoginRequestDTO;
import com.capitally.app.model.request.RegisterRequestDTO;
import com.capitally.app.model.response.AuthResponseDTO;
import com.capitally.app.model.response.MeResponseDTO;
import com.capitally.app.core.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.CONFLICT;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthenticationManager am;
    private final JwtTokenProvider jwt;
    private final PasswordEncoder pe;
    private final UserRepository repo;

    private final String USER_TAKEN_ERROR = "user_taken_error";
    private final String EMAIL_TAKEN_ERROR = "email_taken_error";

    public AuthController(AuthenticationManager am, JwtTokenProvider jwt, PasswordEncoder pe, UserRepository repo) {
        this.am = am;
        this.jwt = jwt;
        this.pe = pe;
        this.repo = repo;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO req) {
        Authentication auth = am.authenticate(new UsernamePasswordAuthenticationToken(req.usernameOrEmail(), req.password()));
        SecurityContextHolder.getContext().setAuthentication(auth);
        String username = auth.getName();
        UserEntity u = repo.findByUsername(username).orElseThrow();
        String token = jwt.generate(u.getUsername(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
        return ResponseEntity.ok(new AuthResponseDTO(token, "Bearer", u.getUsername(), u.getEmail(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet())));
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<AuthResponseDTO> register(@RequestBody RegisterRequestDTO req) {
        if (repo.findByUsername(req.username()).isPresent()) throw new ResponseStatusException(CONFLICT, USER_TAKEN_ERROR);
        if (repo.findByEmail(req.email()).isPresent()) throw new ResponseStatusException(CONFLICT, EMAIL_TAKEN_ERROR);
        UserEntity u = UserEntity.builder()
                .username(req.username())
                .email(req.email())
                .password(pe.encode(req.password()))
                .enabled(true)
                .roles(java.util.List.of(UserRoleEnum.USER))
                .build();
        repo.save(u);
        String token = jwt.generate(u.getUsername(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
        return ResponseEntity.ok(new AuthResponseDTO(token, "Bearer", u.getUsername(), u.getEmail(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet())));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponseDTO> me(@RequestHeader("Authorization") String header) {
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        if (token == null) return ResponseEntity.status(401).build();
        Claims c = jwt.parse(token);
        String username = c.getSubject();
        UserEntity u = repo.findByUsername(username).orElseThrow();
        return ResponseEntity.ok(new MeResponseDTO(u.getId(), u.getUsername(), u.getEmail(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet())));
    }
}