package com.capitally.model.request;

import lombok.Data;

import java.math.BigInteger;

@Data
public class CategoryRequestDTO {
    private String macrocategory;
    private String category;
    private String iconName;
    private BigInteger userId;
}