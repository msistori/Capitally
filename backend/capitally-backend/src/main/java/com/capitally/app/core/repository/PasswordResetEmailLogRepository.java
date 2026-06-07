package com.capitally.app.core.repository;

import com.capitally.app.core.entity.PasswordResetEmailLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigInteger;
import java.time.LocalDateTime;

public interface PasswordResetEmailLogRepository extends JpaRepository<PasswordResetEmailLogEntity, BigInteger> {
    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(LocalDateTime from, LocalDateTime to);

    @Query(value = "select pg_advisory_xact_lock(cast(hashtext(:lockKey) as bigint))", nativeQuery = true)
    Object lockQuota(@Param("lockKey") String lockKey);
}
