package com.capitally.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "transaction_seq")
    @SequenceGenerator(name = "transaction_seq", sequenceName = "transaction_seq", allocationSize = 1)
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

    private Boolean isRecurring;
    private String recurrencePeriod;
    private BigInteger recurrenceInterval;
    private LocalDate recurrenceEndDate;
}