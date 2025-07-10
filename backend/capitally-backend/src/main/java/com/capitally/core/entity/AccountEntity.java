package com.capitally.core.entity;

import com.capitally.core.enums.AccountTypeEnum;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.BigInteger;

@EqualsAndHashCode(callSuper = true)
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
    private BigInteger id;

    private String name;
    private BigDecimal initialBalance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "currency", referencedColumnName = "code")
    private CurrencyEntity currency;

    @Enumerated(EnumType.STRING)
    private AccountTypeEnum accountType;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;
}