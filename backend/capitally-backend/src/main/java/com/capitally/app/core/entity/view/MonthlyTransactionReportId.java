package com.capitally.app.core.entity.view;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.math.BigInteger;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class MonthlyTransactionReportId implements Serializable {

    @JdbcTypeCode(SqlTypes.BIGINT)
    private BigInteger userId;
    private String month;
    private String transactionType;
}