package com.capitally.model.response;

import lombok.Data;

import java.math.BigInteger;

@Data
public class CategoryResponseDTO {
    private BigInteger id;
    private String macroCategory;
    private String category;
    private String iconName;
    private BigInteger userId;
}