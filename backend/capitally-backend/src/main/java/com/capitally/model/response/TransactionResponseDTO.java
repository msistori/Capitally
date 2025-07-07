package com.capitally.model.response;

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
    private Boolean isRecurring;
    private String recurrencePeriod;
    private BigInteger recurrenceInterval;
    private LocalDate recurrenceEndDate;
}