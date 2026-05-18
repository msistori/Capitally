package com.capitally.app.core.repository;

import com.capitally.app.core.entity.CurrencyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface CurrencyRepository extends JpaRepository<CurrencyEntity, String>, JpaSpecificationExecutor<CurrencyEntity> {

    List<CurrencyEntity> findByCodeIn(Set<String> codes);

    Optional<CurrencyEntity> findByCode(String code);
}