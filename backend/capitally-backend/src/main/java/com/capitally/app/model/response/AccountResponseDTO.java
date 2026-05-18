package com.capitally.app.model.response;

import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;

@Data
public class AccountResponseDTO {
    private BigInteger id;
    private String name;
    private BigDecimal initialBalance;
    private BigInteger userId;
}