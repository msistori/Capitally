package com.capitally.app.core.repository;

import com.capitally.app.core.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.math.BigInteger;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {
    @Query("select t.session.id from RefreshTokenEntity t where t.tokenHash = :hash")
    Optional<UUID> findSessionId(String hash);

    @Modifying
    @Query("delete from RefreshTokenEntity t where t.session.user.id = :userId")
    void deleteByUserId(BigInteger userId);

    @Modifying
    @Query("delete from RefreshTokenEntity t where t.session.expiresAt <= :now")
    void deleteExpired(Instant now);
}
