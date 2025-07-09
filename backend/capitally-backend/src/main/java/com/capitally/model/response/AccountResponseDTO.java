package com.capitally.model.response;

import com.capitally.core.enums.AccountType;
import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;

@Data
public class AccountResponseDTO {
    private BigInteger id;
    private String name;
    private BigDecimal initialBalance;
    private String currency;
    private AccountType accountType;
    private BigInteger userId;
}