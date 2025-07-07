package com.capitally.model.request;

import com.capitally.core.enums.AccountType;
import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;

@Data
public class AccountRequestDTO {
    private String name;
    private BigDecimal initialBalance;
    private String currency;
    private AccountType accountType;
    private BigInteger userId;
}