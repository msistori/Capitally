package com.capitally.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrentBalanceResponseDTO {
    private String currency;
    private BigDecimal totalBalance;
}