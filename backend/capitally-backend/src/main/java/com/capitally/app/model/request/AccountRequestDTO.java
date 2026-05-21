package com.capitally.app.model.request;

import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;

@Data
public class AccountRequestDTO {
    private String name;
    private BigDecimal initialBalance;
    private String currencyInitialBalanceCode;
    private String iconName;
    private Boolean includeInTotalBalance;
    private BigInteger userId;
}
