package com.capitally.app.model.request;

import com.capitally.app.core.enums.TransactionTypeEnum;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class TransactionExportFilter {
    private String account;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String macroCategory;
    private String category;
    private String currency;
    private TransactionTypeEnum transactionType;
}