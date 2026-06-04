package com.capitally.app.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigInteger;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "t_password_reset_email_log",
        indexes = {
                @Index(name = "idx_password_reset_email_log_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetEmailLogEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "password_reset_email_log_seq")
    @SequenceGenerator(name = "password_reset_email_log_seq", sequenceName = "password_reset_email_log_seq", allocationSize = 1)
    private BigInteger id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "recipient_email", nullable = false, length = 320)
    private String recipientEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
