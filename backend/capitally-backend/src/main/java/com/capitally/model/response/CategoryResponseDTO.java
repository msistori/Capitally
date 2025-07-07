package com.capitally.model.response;

import com.capitally.core.enums.CategoryType;
import lombok.Data;

import java.math.BigInteger;

@Data
public class CategoryResponseDTO {
    private BigInteger id;
    private String macrocategory;
    private String category;
    private CategoryType categoryType;
}