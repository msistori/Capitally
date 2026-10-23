package com.capitally.app.core.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "t_refresh_token", indexes = @Index(name = "idx_refresh_token_session", columnList = "session_id"))
@Getter
@Setter
@NoArgsConstructor
public class RefreshTokenEntity {
    @Id
    @Column(name = "token_hash", length = 64)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AuthSessionEntity session;

    @Column(nullable = false)
    private boolean consumed;
}
