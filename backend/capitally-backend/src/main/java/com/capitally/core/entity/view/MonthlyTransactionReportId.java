package com.capitally.core.entity.view;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigInteger;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class MonthlyTransactionReportId implements Serializable {

    private BigInteger userId;
    private String month;
    private String transactionType;
}