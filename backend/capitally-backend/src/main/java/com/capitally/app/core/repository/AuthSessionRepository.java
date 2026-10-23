package com.capitally.app.core.repository;

import com.capitally.app.core.entity.AuthSessionEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.math.BigInteger;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AuthSessionRepository extends JpaRepository<AuthSessionEntity, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from AuthSessionEntity s where s.id = :id")
    Optional<AuthSessionEntity> findLockedById(UUID id);

    @Query("select s from AuthSessionEntity s join fetch s.user where s.id = :id")
    Optional<AuthSessionEntity> findWithUserById(UUID id);

    @Modifying
    @Query("update AuthSessionEntity s set s.revoked = true where s.user.id = :userId")
    void revokeByUserId(BigInteger userId);

    @Modifying
    @Query("delete from AuthSessionEntity s where s.user.id = :userId")
    void deleteByUserId(BigInteger userId);

    @Modifying
    @Query("delete from AuthSessionEntity s where s.expiresAt <= :now")
    void deleteExpired(Instant now);
}
