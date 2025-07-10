package com.capitally.model.request;

import com.capitally.core.enums.CategoryTypeEnum;
import lombok.Data;

@Data
public class CategoryRequestDTO {
    private String macroCategory;
    private String category;
    private CategoryTypeEnum categoryType;
}