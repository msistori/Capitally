package com.capitally.app.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;

@Data
@AllArgsConstructor
public class AccountBalanceResponseDTO {
    private BigInteger accountId;
    private String accountName;
    private String iconName;
    private String currency;
    private BigDecimal balance;
}
