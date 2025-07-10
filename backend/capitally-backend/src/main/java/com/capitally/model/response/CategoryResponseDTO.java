package com.capitally.model.response;

import com.capitally.core.enums.CategoryTypeEnum;
import lombok.Data;

import java.math.BigInteger;

@Data
public class CategoryResponseDTO {
    private BigInteger id;
    private String macroCategory;
    private String category;
    private CategoryTypeEnum categoryType;
}