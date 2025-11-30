package com.capitally.app.service;

import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.repository.UserRepository;
import com.capitally.app.model.request.ChangePasswordRequestDTO;
import com.capitally.app.model.request.UpdateUserRequestDTO;
import com.capitally.app.model.response.UserResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repo, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserResponseDTO me(Authentication auth) {
        UserEntity u = repo.findByUsername(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return toResponse(u);
    }

    @Transactional
    public UserResponseDTO updateProfile(Authentication auth, UpdateUserRequestDTO req) {
        UserEntity u = repo.findByUsername(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.username() != null && !Objects.equals(req.username(), u.getUsername())) {
            if (repo.findByUsername(req.username()).isPresent()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username_taken");
            u.setUsername(req.username().trim());
        }
        if (req.email() != null && !Objects.equals(req.email(), u.getEmail())) {
            if (repo.findByEmail(req.email()).isPresent()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email_taken");
            u.setEmail(req.email().trim().toLowerCase());
        }
        return toResponse(repo.save(u));
    }

    @Transactional
    public void changePassword(Authentication auth, ChangePasswordRequestDTO req) {
        UserEntity u = repo.findByUsername(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!passwordEncoder.matches(req.currentPassword(), u.getPassword())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_current_password");
        u.setPassword(passwordEncoder.encode(req.newPassword()));
        repo.save(u);
    }

    private UserResponseDTO toResponse(UserEntity u) {
        Set<String> roles = u.getRoles() == null ? Set.of() : u.getRoles().stream().map(Enum::name).collect(Collectors.toSet());
        return new UserResponseDTO(u.getId(), u.getUsername(), u.getEmail(), roles, u.isEnabled());
    }
}
