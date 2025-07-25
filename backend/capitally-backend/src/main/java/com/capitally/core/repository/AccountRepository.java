package com.capitally.core.repository;

import com.capitally.core.entity.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.math.BigInteger;

@Repository
public interface AccountRepository extends JpaRepository<AccountEntity, BigInteger>, JpaSpecificationExecutor<AccountEntity> {
}