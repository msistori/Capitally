package com.capitally.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseBreakdownResponseDTO {
    private String macroCategory;
    private String currency;
    private BigDecimal total;
}