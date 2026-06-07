package com.capitally.app.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnualIncomeExpenseResponseDTO {
    private String month;
    private String currency;
    private BigDecimal income;
    private BigDecimal expense;
}
