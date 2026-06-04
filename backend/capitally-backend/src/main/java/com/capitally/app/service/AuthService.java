package com.capitally.app.service;

import com.capitally.app.core.entity.CategoryEntity;
import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.enums.UserRoleEnum;
import com.capitally.app.core.repository.CategoryRepository;
import com.capitally.app.core.repository.UserRepository;
import com.capitally.app.core.security.JwtTokenProvider;
import com.capitally.app.model.request.ForgotPasswordRequestDTO;
import com.capitally.app.model.request.LoginRequestDTO;
import com.capitally.app.model.request.RegisterRequestDTO;
import com.capitally.app.model.response.AuthResponseDTO;
import com.capitally.app.model.response.MeResponseDTO;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
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
    private final CategoryRepository categoryRepository;
    private final ResendEmailService resendEmailService;
    private final ForgotPasswordEmailQuotaService forgotPasswordEmailQuotaService;

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

        //Save Default Category
        CategoryEntity defaultCategory = CategoryEntity.builder()
                .macroCategory("Other")
                .category("Other")
                .iconName("Question-mark")
                .user(u)
                .build();

        categoryRepository.save(defaultCategory);

        String token = jwt.generate(u.getId(), u.getUsername(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
        return new AuthResponseDTO(token, "Bearer", u.getUsername(), u.getEmail(), u.getRoles().stream().map(Enum::name).collect(Collectors.toSet()));
    }

    public AuthResponseDTO login(LoginRequestDTO req) {
        Authentication auth = am.authenticate(new UsernamePasswordAuthenticationToken(req.usernameOrEmail(), req.password()));
        SecurityContextHolder.getContext().setAuthentication(auth);
        String username = auth.getName();
        UserEntity u = repo.findByUsername(username).orElseThrow();
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
