package com.capitally.core.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "t_currency")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurrencyEntity extends AuditableEntity {
    @Id
    private String code;
    private String name;
}