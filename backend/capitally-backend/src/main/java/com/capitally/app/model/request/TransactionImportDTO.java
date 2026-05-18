package com.capitally.app.model.request;

import com.capitally.app.core.enums.TransactionRecurrencePeriodEnum;
import com.capitally.app.core.enums.TransactionTypeEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionImportDTO {
    private String accountName;
    private BigDecimal amount;
    private String currencyCode;
    private LocalDate date;
    private String description;
    private String macroCategory;
    private String category;
    private TransactionTypeEnum transactionType;
    private Boolean isRecurring;
    private TransactionRecurrencePeriodEnum recurrencePeriod;
    private LocalDate recurrenceEndDate;
    private Integer rowNumber;
}