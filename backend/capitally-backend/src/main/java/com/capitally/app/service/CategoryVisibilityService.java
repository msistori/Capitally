package com.capitally.app.service;

import com.capitally.app.core.entity.CategoryEntity;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.util.List;
import java.util.Objects;

@Service
public class CategoryVisibilityService {
    private static final String TECHNICAL_MACRO_CATEGORY = "Other";
    private static final String TECHNICAL_CATEGORY = "Other";
    private static final String TECHNICAL_ICON_NAME = "Question-mark";

    public List<CategoryEntity> visibleCategories(List<CategoryEntity> categories) {
        BigInteger hiddenCategoryId = technicalOtherId(categories);

        return categories.stream()
                .filter(category -> !Objects.equals(category.getId(), hiddenCategoryId))
                .toList();
    }

    public boolean isHiddenTechnicalOther(CategoryEntity category, List<CategoryEntity> userCategories) {
        return Objects.equals(category.getId(), technicalOtherId(userCategories));
    }

    public boolean isTechnicalOther(CategoryEntity category) {
        return category != null
                && TECHNICAL_MACRO_CATEGORY.equals(category.getMacroCategory())
                && TECHNICAL_CATEGORY.equals(category.getCategory())
                && TECHNICAL_ICON_NAME.equals(category.getIconName());
    }

    private BigInteger technicalOtherId(List<CategoryEntity> categories) {
        return categories.stream()
                .filter(this::isTechnicalOther)
                .map(CategoryEntity::getId)
                .filter(Objects::nonNull)
                .min(BigInteger::compareTo)
                .orElse(null);
    }
}
