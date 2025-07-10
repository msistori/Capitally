package com.capitally.model.request;

import com.capitally.core.enums.AccountTypeEnum;
import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;

@Data
public class AccountRequestDTO {
    private String name;
    private BigDecimal initialBalance;
    private String currency;
    private AccountTypeEnum accountType;
    private BigInteger userId;
}