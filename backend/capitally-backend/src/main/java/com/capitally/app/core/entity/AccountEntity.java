package com.capitally.app.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.math.BigInteger;

@Entity
@Table(name = "t_account")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "account_seq")
    @SequenceGenerator(name = "account_seq", sequenceName = "account_seq", allocationSize = 1)
    @JdbcTypeCode(SqlTypes.BIGINT)
    private BigInteger id;

    private String name;
    private BigDecimal initialBalance;
    private String iconName;
    private Boolean includeInTotalBalance;

    @ManyToOne
    @JoinColumn(name = "currency_initial_balance")
    private CurrencyEntity currencyInitialBalance;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;
}
