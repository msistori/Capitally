package com.capitally.core.entity.view;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;

@Entity
@Table(name = "v_transaction_monthly_report")
@Immutable
@Getter
@Setter
public class MonthlyTransactionReportView {

    @EmbeddedId
    private MonthlyTransactionReportId id;

    @Column(name = "total")
    private BigDecimal total;
}