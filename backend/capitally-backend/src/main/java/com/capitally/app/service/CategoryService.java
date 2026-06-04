package com.capitally.app.service;

import com.capitally.app.core.entity.CategoryEntity;
import com.capitally.app.core.entity.TransactionEntity;
import com.capitally.app.core.repository.CategoryRepository;
import com.capitally.app.core.repository.TransactionRepository;
import com.capitally.app.mapper.CategoryMapper;
import com.capitally.app.model.request.CategoryRequestDTO;
import com.capitally.app.model.response.CategoryResponseDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.capitally.app.utils.CapitallyUtils.addIfNotNull;
import static com.capitally.app.utils.CapitallyUtils.buildLikePredicate;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryMapper categoryMapper;

    private final String OTHER_CATEGORY = "Other";

    public CategoryResponseDTO postCategory(CategoryRequestDTO input) {
        CategoryEntity entity = categoryMapper.mapCategoryDTOToEntity(input);
        return categoryMapper.mapCategoryEntityToDTO(categoryRepository.save(entity));
    }

    public List<CategoryResponseDTO> getCategories(String macroCategory, String category, String iconName, BigInteger userId) {
        Specification<CategoryEntity> spec = buildSpecification(macroCategory, category, iconName, userId, false);
        return categoryRepository.findAll(spec).stream()
                .map(categoryMapper::mapCategoryEntityToDTO)
                .toList();
    }

    public CategoryResponseDTO putCategory(BigInteger userId, BigInteger id, CategoryRequestDTO dto) {
        CategoryEntity existing = categoryRepository.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        existing.setMacroCategory(dto.getMacroCategory());
        existing.setCategory(dto.getCategory());
        existing.setIconName(dto.getIconName());

        return categoryMapper.mapCategoryEntityToDTO(categoryRepository.save(existing));
    }

    public void deleteCategory(BigInteger userId, BigInteger categoryId, String macroCategory, String category, String iconName) {
        if(categoryId != null) {
            Optional<CategoryEntity> categoryToDelete = categoryRepository.findByIdAndUser_Id(categoryId, userId);
            if(categoryToDelete.isPresent()) {
                moveTransactionsFromCategoryToOther(userId, categoryToDelete.get());
                categoryRepository.deleteById(categoryId);
            }
        } else {
            Specification<CategoryEntity> spec = buildSpecification(macroCategory, category, iconName, userId, true);
            List<CategoryEntity> categoriesToDelete = categoryRepository.findAll(spec);

            if(!CollectionUtils.isEmpty(categoriesToDelete)) {
                categoriesToDelete.forEach(c -> moveTransactionsFromCategoryToOther(userId, c));
                
                categoryRepository.delete(spec);
            }
        }
    }

    private Specification<CategoryEntity> buildSpecification(String macroCategory, String category, String iconName, BigInteger userId, boolean isDeleting) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if(isDeleting) {
                predicates.add(cb.notEqual(root.get("macroCategory"), OTHER_CATEGORY));
                predicates.add(cb.notEqual(root.get("category"), OTHER_CATEGORY));
            }

            addIfNotNull(predicates, macroCategory, () -> buildLikePredicate(cb, root.get("macroCategory"), macroCategory));
            addIfNotNull(predicates, category, () -> buildLikePredicate(cb, root.get("category"), category));
            addIfNotNull(predicates, iconName, () -> buildLikePredicate(cb, root.get("iconName"), iconName));
            addIfNotNull(predicates, userId, () -> cb.equal(root.get("user").get("id"), userId));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void moveTransactionsFromCategoryToOther(BigInteger userId, CategoryEntity categoryEntity) {
        CategoryEntity categoryOther = categoryRepository.findByCategoryAndMacroCategoryAndUser_Id("Other", "Other", userId)
                                            .orElse(null);
        if (categoryOther == null) {
            return ;
        }

        List<TransactionEntity> transactions =
                transactionRepository.findByUser_IdAndCategory_Id(userId, categoryEntity.getId());

        transactions.forEach(t -> t.setCategory(categoryOther));

        transactionRepository.saveAll(transactions);
    }
}
