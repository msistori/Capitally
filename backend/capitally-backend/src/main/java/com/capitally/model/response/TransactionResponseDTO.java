package com.capitally.model.response;

import com.capitally.core.enums.TransactionRecurrencePeriodEnum;
import com.capitally.core.enums.TransactionTypeEnum;
import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;

@Data
public class TransactionResponseDTO {
    private BigInteger id;
    private BigInteger userId;
    private BigInteger accountId;
    private BigDecimal amount;
    private String currencyCode;
    private LocalDate date;
    private String description;
    private BigInteger categoryId;
    private TransactionTypeEnum transactionType;
    private Boolean isRecurring;
    private TransactionRecurrencePeriodEnum recurrencePeriod;
    private LocalDate recurrenceEndDate;
}