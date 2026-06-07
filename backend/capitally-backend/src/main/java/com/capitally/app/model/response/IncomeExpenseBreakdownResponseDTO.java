package com.capitally.app.model.response;

import com.capitally.app.core.enums.TransactionTypeEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncomeExpenseBreakdownResponseDTO {
    private TransactionTypeEnum transactionType;
    private String macroCategory;
    private String currency;
    private BigDecimal total;
}