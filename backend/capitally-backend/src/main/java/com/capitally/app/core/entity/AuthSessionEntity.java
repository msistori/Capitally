package com.capitally.app.core.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "t_auth_session", indexes = {
        @Index(name = "idx_auth_session_user", columnList = "user_id"),
        @Index(name = "idx_auth_session_expiry", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
public class AuthSessionEntity {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "credentials_hash", nullable = false, length = 64)
    private String credentialsHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_used_at", nullable = false)
    private Instant lastUsedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean revoked;
}
