package com.capitally.app.model.request;

import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;

@Data
public class TransferRequestDTO {
    private BigInteger userId;
    private BigInteger sourceAccountId;
    private BigInteger destinationAccountId;
    private BigDecimal amount;
    private String currencyCode;
    private LocalDate date;
    private String description;
}
