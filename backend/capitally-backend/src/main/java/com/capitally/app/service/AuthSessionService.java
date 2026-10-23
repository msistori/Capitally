package com.capitally.app.service;

import com.capitally.app.core.entity.AuthSessionEntity;
import com.capitally.app.core.entity.RefreshTokenEntity;
import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.repository.AuthSessionRepository;
import com.capitally.app.core.repository.RefreshTokenRepository;
import com.capitally.app.core.security.JwtTokenProvider;
import com.capitally.app.core.security.UserPrincipal;
import com.capitally.app.model.response.AuthResponseDTO;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthSessionService {
    private static final Duration MAX_AGE = Duration.ofDays(30);
    private static final Duration IDLE_TIMEOUT = Duration.ofDays(30);
    private static final SecureRandom RANDOM = new SecureRandom();
    private final AuthSessionRepository sessions;
    private final RefreshTokenRepository tokens;
    private final JwtTokenProvider jwt;

    public record IssuedSession(AuthResponseDTO response, String refreshToken, Instant expiresAt) {}

    @Transactional
    public IssuedSession start(UserEntity user, boolean persistent) {
        Instant now = Instant.now();
        AuthSessionEntity session = new AuthSessionEntity();
        session.setId(UUID.randomUUID());
        session.setUser(user);
        session.setCredentialsHash(digest(user.getPassword()));
        session.setCreatedAt(now);
        session.setLastUsedAt(now);
        session.setExpiresAt(now.plus(persistent ? MAX_AGE : Duration.ofMinutes(15)));
        sessions.save(session);
        return issue(session, persistent);
    }

    @Transactional
    public IssuedSession refresh(String rawToken) {
        String hash = hashToken(rawToken);
        if (hash == null) return null;
        UUID sessionId = tokens.findSessionId(hash).orElse(null);
        if (sessionId == null) return null;
        AuthSessionEntity session = sessions.findLockedById(sessionId).orElse(null);
        if (session == null) return null;
        RefreshTokenEntity token = tokens.findById(hash).orElse(null);
        if (token == null || token.isConsumed() || !isActive(session, Instant.now())) {
            // Return normally so replay revocation is committed, even though the HTTP response is 401.
            session.setRevoked(true);
            return null;
        }
        token.setConsumed(true);
        session.setLastUsedAt(Instant.now());
        return issue(session, true);
    }

    @Transactional(readOnly = true)
    public UserPrincipal principal(Claims claims) {
        String sessionId = claims.get("sid", String.class);
        if (sessionId == null) return null;
        AuthSessionEntity session = sessions.findWithUserById(UUID.fromString(sessionId)).orElse(null);
        if (session == null || !isActive(session, Instant.now())
                || !session.getUser().getId().toString().equals(claims.getId())) return null;
        UserEntity user = session.getUser();
        return new UserPrincipal(user.getId(), user.getUsername(), "", user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name())).toList(), true);
    }

    @Transactional
    public void logout(String rawToken, String accessToken) {
        String hash = hashToken(rawToken);
        if (hash != null) tokens.findSessionId(hash).ifPresent(this::revoke);
        if (accessToken != null) {
            try {
                String id = jwt.parse(accessToken).get("sid", String.class);
                if (id != null) revoke(UUID.fromString(id));
            } catch (io.jsonwebtoken.JwtException | IllegalArgumentException ignored) {
                // A refresh cookie can still revoke a session after its access token expires.
            }
        }
    }

    @Transactional
    public void revokeAll(BigInteger userId) {
        sessions.revokeByUserId(userId);
    }

    @Transactional
    public void deleteForUser(BigInteger userId) {
        tokens.deleteByUserId(userId);
        sessions.deleteByUserId(userId);
    }

    @Scheduled(fixedDelay = 3600000)
    @Transactional
    public void removeExpiredSessions() {
        Instant now = Instant.now();
        tokens.deleteExpired(now);
        sessions.deleteExpired(now);
    }

    private void revoke(UUID id) {
        sessions.findLockedById(id).ifPresent(session -> session.setRevoked(true));
    }

    private boolean isActive(AuthSessionEntity session, Instant now) {
        return !session.isRevoked() && session.getUser().isEnabled()
                && session.getCredentialsHash().equals(digest(session.getUser().getPassword()))
                && now.isBefore(session.getExpiresAt())
                && now.isBefore(session.getLastUsedAt().plus(IDLE_TIMEOUT));
    }

    private IssuedSession issue(AuthSessionEntity session, boolean persistent) {
        String rawToken = null;
        if (persistent) {
            byte[] bytes = new byte[32];
            RANDOM.nextBytes(bytes);
            rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            RefreshTokenEntity token = new RefreshTokenEntity();
            token.setTokenHash(hashToken(rawToken));
            token.setSession(session);
            tokens.save(token);
        }
        UserEntity user = session.getUser();
        var roles = user.getRoles().stream().map(Enum::name).collect(Collectors.toSet());
        String accessToken = jwt.generate(user.getId(), user.getUsername(), roles, session.getId(), session.getExpiresAt());
        return new IssuedSession(new AuthResponseDTO(accessToken, "Bearer", user.getUsername(), user.getEmail(),
                roles, user.isPasswordChangeRequired()), rawToken, session.getExpiresAt());
    }

    private String hashToken(String token) {
        if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) return null;
        return digest(token);
    }

    private String digest(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is required", ex);
        }
    }
}
