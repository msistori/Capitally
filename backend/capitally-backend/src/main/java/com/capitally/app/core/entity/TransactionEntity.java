package com.capitally.app.core.entity;

import com.capitally.app.core.enums.TransactionRecurrencePeriodEnum;
import com.capitally.app.core.enums.TransactionTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "t_transaction")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "transaction_seq")
    @SequenceGenerator(name = "transaction_seq", sequenceName = "transaction_seq", allocationSize = 1)
    @JdbcTypeCode(SqlTypes.BIGINT)
    private BigInteger id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private AccountEntity account;

    private BigDecimal amount;

    @ManyToOne
    @JoinColumn(name = "currency")
    private CurrencyEntity currency;

    private LocalDate date;
    private String description;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private CategoryEntity category;

    @Enumerated(EnumType.STRING)
    private TransactionTypeEnum transactionType;

    private Boolean isRecurring;

    @Enumerated(EnumType.STRING)
    private TransactionRecurrencePeriodEnum recurrencePeriod;

    private LocalDate recurrenceEndDate;

    private String transferGroupId;

    @ManyToOne
    @JoinColumn(name = "transfer_counterparty_account_id")
    private AccountEntity transferCounterpartyAccount;
}
