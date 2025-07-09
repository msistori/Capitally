package com.capitally.command;

import com.capitally.core.entity.CategoryEntity;
import com.capitally.core.enums.CategoryType;
import com.capitally.core.repository.CategoryRepository;
import com.capitally.mapper.CategoryMapper;
import com.capitally.model.request.CategoryRequestDTO;
import com.capitally.model.response.CategoryResponseDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

import static com.capitally.utils.CapitallyUtils.addIfNotNull;
import static com.capitally.utils.CapitallyUtils.buildLikePredicate;

@Component
@RequiredArgsConstructor
public class CategoryCommand {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryResponseDTO postCategory(CategoryRequestDTO input) {
        CategoryEntity entity = categoryMapper.mapCategoryDTOToEntity(input);
        return categoryMapper.mapCategoryEntityToDTO(categoryRepository.save(entity));
    }

    public List<CategoryResponseDTO> getCategories(String macrocategory, String category, CategoryType categoryType) {
        Specification<CategoryEntity> spec = buildSpecification(macrocategory, category, categoryType);
        return categoryRepository.findAll(spec).stream()
                .map(categoryMapper::mapCategoryEntityToDTO)
                .toList();
    }

    public CategoryResponseDTO putCategory(BigInteger id, CategoryRequestDTO dto) {
        CategoryEntity existing = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        existing.setCategoryType(dto.getCategoryType());
        existing.setMacrocategory(dto.getMacrocategory());
        existing.setCategory(dto.getCategory());

        return categoryMapper.mapCategoryEntityToDTO(categoryRepository.save(existing));
    }

    public void deleteCategory(BigInteger id) {
        categoryRepository.deleteById(id);
    }

    private Specification<CategoryEntity> buildSpecification(String macrocategory, String category, CategoryType categoryType) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            addIfNotNull(predicates, macrocategory, () -> buildLikePredicate(cb, root.get("macrocategory"), macrocategory));
            addIfNotNull(predicates, category, () -> buildLikePredicate(cb, root.get("category"), category));
            addIfNotNull(predicates, categoryType, () -> cb.equal(root.get("categoryType"), categoryType));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }


}