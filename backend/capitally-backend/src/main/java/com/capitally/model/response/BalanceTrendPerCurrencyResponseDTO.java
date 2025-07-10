package com.capitally.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BalanceTrendPerCurrencyResponseDTO {
    private String month;
    private String currency;
    private BigDecimal balance;
}