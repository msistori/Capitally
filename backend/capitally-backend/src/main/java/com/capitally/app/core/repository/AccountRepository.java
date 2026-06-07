package com.capitally.app.core.repository;

import com.capitally.app.core.entity.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.math.BigInteger;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface AccountRepository extends JpaRepository<AccountEntity, BigInteger>, JpaSpecificationExecutor<AccountEntity> {

    List<AccountEntity> findByUserId(BigInteger userId);

    List<AccountEntity> findByNameInAndUser_Id(Set<String> names, BigInteger userId);

    Optional<AccountEntity> findByNameAndUser_Id(String name, BigInteger userId);

    Optional<AccountEntity> findByIdAndUser_Id(BigInteger id, BigInteger userId);

    void deleteByUser_Id(BigInteger userId);
}
