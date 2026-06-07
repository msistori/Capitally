package com.capitally.app.service;

import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.enums.UserRoleEnum;
import com.capitally.app.core.repository.UserRepository;
import com.capitally.app.core.security.JwtTokenProvider;
import com.capitally.app.model.request.ForgotPasswordRequestDTO;
import com.capitally.app.model.request.LoginRequestDTO;
import com.capitally.app.model.request.RegisterRequestDTO;
import com.capitally.app.model.response.AuthResponseDTO;
import com.capitally.app.model.response.MeResponseDTO;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.stream.Collectors;

import static com.capitally.app.utils.CapitallyErrors.AUTH_EMAIL_TAKEN_ERROR;
import static com.capitally.app.utils.CapitallyErrors.AUTH_USER_TAKEN_ERROR;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private static final int TEMPORARY_PASSWORD_LENGTH = 14;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AuthenticationManager am;
    private final JwtTokenProvider jwt;
    private final PasswordEncoder pe;
    private final UserRepository repo;
    private final DefaultCategoryService defaultCategoryService;
    private final DemoDataRefreshService demoDataRefreshService;
    private final ResendEmailService resendEmailService;
    private final ForgotPasswordEmailQuotaService forgotPasswordEmailQuotaService;

    @Value("${guest-login.enabled:true}")
    private boolean guestLoginEnabled;

    @Value("${guest-login.username:demo}")
    private String guestLoginUsername;

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO req) {
        if (repo.findByUsername(req.username()).isPresent()) throw new ResponseStatusException(CONFLICT, AUTH_USER_TAKEN_ERROR);
        if (repo.findByEmail(req.email()).isPresent()) throw new ResponseStatusException(CONFLICT, AUTH_EMAIL_TAKEN_ERROR);
        UserEntity u = UserEntity.builder()
                .username(req.username())
                .email(req.email())
                .password(pe.encode(req.password()))
                .enabled(true)
                .roles(java.util.List.of(UserRoleEnum.USER))
                .build();
        repo.save(u);

        defaultCategoryService.createForUser(u, req.lang());

        String token = jwt.generate(u.getId(), u.getUsername(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
        return new AuthResponseDTO(token, "Bearer", u.getUsername(), u.getEmail(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
    }

    public AuthResponseDTO login(LoginRequestDTO req) {
        String usernameOrEmail = req.usernameOrEmail() == null ? "" : req.usernameOrEmail().trim();
        Authentication auth = am.authenticate(new UsernamePasswordAuthenticationToken(usernameOrEmail, req.password()));
        SecurityContextHolder.getContext().setAuthentication(auth);
        String username = auth.getName();
        UserEntity u = repo.findByUsername(username).orElseThrow();
        return issueToken(u);
    }

    public AuthResponseDTO guestLogin() {
        if (!guestLoginEnabled) {
            throw new ResponseStatusException(NOT_FOUND);
        }

        UserEntity u = repo.findByUsername(guestLoginUsername)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND));

        if (!u.isEnabled() || u.getRoles() == null || !u.getRoles().contains(UserRoleEnum.DEMO)) {
            throw new ResponseStatusException(FORBIDDEN);
        }

        return issueToken(u);
    }

    private AuthResponseDTO issueToken(UserEntity u) {
        if (u.getRoles() != null && u.getRoles().contains(UserRoleEnum.DEMO)) {
            demoDataRefreshService.refreshIfNeeded(u);
        }
        String token = jwt.generate(u.getId(), u.getUsername(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
        return new AuthResponseDTO(token, "Bearer", u.getUsername(), u.getEmail(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequestDTO req) {
        String usernameOrEmail = req == null ? null : req.usernameOrEmail();
        if (!StringUtils.hasText(usernameOrEmail)) {
            return;
        }

        repo.findByUsernameIgnoreCaseOrEmailIgnoreCase(usernameOrEmail.trim(), usernameOrEmail.trim())
                .ifPresent(user -> {
                    resendEmailService.validateConfigured();
                    forgotPasswordEmailQuotaService.reserve(user);
                    String temporaryPassword = generateTemporaryPassword();
                    user.setPassword(pe.encode(temporaryPassword));
                    repo.save(user);
                    resendEmailService.sendTemporaryPassword(user.getEmail(), temporaryPassword, req.lang());
                });
    }

    public MeResponseDTO me(String token) {
        Claims c = jwt.parse(token);
        String username = c.getSubject();
        UserEntity u = repo.findByUsername(username).orElseThrow();
        return new MeResponseDTO(u.getId(), u.getUsername(), u.getEmail(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
    }

    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(TEMPORARY_PASSWORD_LENGTH);
        for (int i = 0; i < TEMPORARY_PASSWORD_LENGTH; i++) {
            password.append(PASSWORD_CHARS.charAt(SECURE_RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return password.toString();
    }
}
