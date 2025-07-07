package com.capitally.model.request;

import lombok.Data;

@Data
public class CurrencyRequestDTO {
    private String code;
    private String name;
}