package com.capitally.model.response;

import com.capitally.core.enums.TransactionRecurrencePeriodEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingRecurringTransactionResponseDTO {
    private String description;
    private BigDecimal amount;
    private String currency;
    private LocalDate nextDate;
    private TransactionRecurrencePeriodEnum frequency;
    private String category;
    private String account;
}