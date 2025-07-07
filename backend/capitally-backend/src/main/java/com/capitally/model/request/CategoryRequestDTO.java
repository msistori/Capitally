package com.capitally.model.request;

import com.capitally.core.enums.CategoryType;
import lombok.Data;

@Data
public class CategoryRequestDTO {
    private String macrocategory;
    private String category;
    private CategoryType categoryType;
}