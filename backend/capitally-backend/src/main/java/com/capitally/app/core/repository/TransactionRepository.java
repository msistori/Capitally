package com.capitally.app.core.repository;

import com.capitally.app.core.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, BigInteger>, JpaSpecificationExecutor<TransactionEntity> {

    List<TransactionEntity> findAllByAccountId(BigInteger accountId);

    List<TransactionEntity> findByUserIdAndDateBetween(BigInteger userId, LocalDate start, LocalDate end);

    List<TransactionEntity> findByUserIdAndIsRecurringTrue(BigInteger userId);

    Optional<TransactionEntity> findByIdAndUser_Id(BigInteger id, BigInteger userId);

    List<TransactionEntity> findByUser_IdAndCategory_Id(BigInteger userId, BigInteger categoryId);

    List<TransactionEntity> findByUser_IdAndAccount_Name(BigInteger userId, String accountName);
}