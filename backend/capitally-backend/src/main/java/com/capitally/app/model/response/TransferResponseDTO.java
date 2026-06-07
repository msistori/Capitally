package com.capitally.app.model.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;

@Data
@Builder
public class TransferResponseDTO {
    private String transferGroupId;
    private BigInteger sourceTransactionId;
    private BigInteger destinationTransactionId;
    private BigInteger sourceAccountId;
    private String sourceAccountName;
    private String sourceAccountIconName;
    private BigInteger destinationAccountId;
    private String destinationAccountName;
    private String destinationAccountIconName;
    private BigDecimal amount;
    private String currencyCode;
    private LocalDate date;
    private String description;
}
