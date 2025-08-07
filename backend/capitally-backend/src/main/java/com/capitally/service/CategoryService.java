package com.capitally.service;

import com.capitally.core.entity.CategoryEntity;
import com.capitally.core.repository.CategoryRepository;
import com.capitally.mapper.CategoryMapper;
import com.capitally.model.request.CategoryRequestDTO;
import com.capitally.model.response.CategoryResponseDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

import static com.capitally.utils.CapitallyUtils.addIfNotNull;
import static com.capitally.utils.CapitallyUtils.buildLikePredicate;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryResponseDTO postCategory(CategoryRequestDTO input) {
        CategoryEntity entity = categoryMapper.mapCategoryDTOToEntity(input);
        return categoryMapper.mapCategoryEntityToDTO(categoryRepository.save(entity));
    }

    public List<CategoryResponseDTO> getCategories(String macroCategory, String category, String iconName, BigInteger userId) {
        Specification<CategoryEntity> spec = buildSpecification(macroCategory, category, iconName, userId);
        return categoryRepository.findAll(spec).stream()
                .map(categoryMapper::mapCategoryEntityToDTO)
                .toList();
    }

    public CategoryResponseDTO putCategory(BigInteger id, CategoryRequestDTO dto) {
        CategoryEntity existing = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        existing.setMacroCategory(dto.getMacroCategory());
        existing.setCategory(dto.getCategory());

        return categoryMapper.mapCategoryEntityToDTO(categoryRepository.save(existing));
    }

    public void deleteCategory(BigInteger id) {
        categoryRepository.deleteById(id);
    }

    private Specification<CategoryEntity> buildSpecification(String macroCategory, String category, String iconName, BigInteger userId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            addIfNotNull(predicates, macroCategory, () -> buildLikePredicate(cb, root.get("macroCategory"), macroCategory));
            addIfNotNull(predicates, category, () -> buildLikePredicate(cb, root.get("category"), category));
            addIfNotNull(predicates, iconName, () -> buildLikePredicate(cb, root.get("iconName"), iconName));
            addIfNotNull(predicates, userId, () -> cb.equal(root.get("user").get("id"), userId));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }


}