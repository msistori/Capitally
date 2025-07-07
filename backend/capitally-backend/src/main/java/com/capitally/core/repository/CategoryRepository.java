package com.capitally.core.repository;

import com.capitally.core.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.math.BigInteger;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, BigInteger>, JpaSpecificationExecutor<CategoryEntity> {
}