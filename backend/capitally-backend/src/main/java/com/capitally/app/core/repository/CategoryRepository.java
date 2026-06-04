package com.capitally.app.core.repository;

import com.capitally.app.core.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.math.BigInteger;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, BigInteger>, JpaSpecificationExecutor<CategoryEntity> {

    List<CategoryEntity> findByUser_Id(BigInteger userId);

    List<CategoryProjection> findByUser_IdAndMacroCategoryIn(BigInteger userId, Collection<String> macros);

    public interface CategoryProjection {
        String getMacroCategory();
        String getCategory();
    }

    Optional<CategoryEntity> findByCategoryAndMacroCategoryAndUser_Id(
            String category, String macroCategory, BigInteger userId);

    Optional<CategoryEntity> findByIdAndUser_Id(BigInteger id, BigInteger userId);

    void deleteByUser_Id(BigInteger userId);
}
