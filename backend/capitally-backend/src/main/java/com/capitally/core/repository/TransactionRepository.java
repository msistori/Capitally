package com.capitally.core.repository;

import com.capitally.core.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.math.BigInteger;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, BigInteger>, JpaSpecificationExecutor<TransactionEntity> {
}